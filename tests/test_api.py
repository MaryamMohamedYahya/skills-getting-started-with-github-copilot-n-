import os
import sys
import pytest

# Ensure src is importable
ROOT = os.path.dirname(os.path.dirname(__file__))
SRC_PATH = os.path.join(ROOT, "src")
if SRC_PATH not in sys.path:
    sys.path.insert(0, SRC_PATH)

from app import get_activities, signup_for_activity, unregister_from_activity, activities


def test_get_activities():
    data = get_activities()
    assert isinstance(data, dict)
    assert "Chess Club" in data


def test_signup_and_unregister_flow():
    activity = "Chess Club"
    email = "teststudent@example.com"

    # ensure not present
    participants = activities[activity]["participants"]
    if email in participants:
        # cleanup if leftover from previous run
        unregister_from_activity(activity, email)

    # sign up
    res = signup_for_activity(activity, email)
    assert isinstance(res, dict)
    assert "Signed up" in res.get("message", "")

    # confirm present
    assert email in activities[activity]["participants"]

    # unregister
    res = unregister_from_activity(activity, email)
    assert isinstance(res, dict)
    assert "Unregistered" in res.get("message", "")

    # confirm removed
    assert email not in activities[activity]["participants"]


def test_signup_duplicate_raises_http_exception():
    from fastapi import HTTPException

    activity = "Programming Class"
    existing = "emma@mergington.edu"
    with pytest.raises(HTTPException):
        signup_for_activity(activity, existing)


def test_unregister_not_registered_raises_http_exception():
    from fastapi import HTTPException

    activity = "Tennis Club"
    email = "not-registered@example.com"
    with pytest.raises(HTTPException):
        unregister_from_activity(activity, email)
