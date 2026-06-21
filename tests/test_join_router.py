import unittest
from types import SimpleNamespace

from modules.join_router import JoinRouterModule


def member(status, is_member=None):
    return SimpleNamespace(status=status, is_member=is_member)


class JoinTransitionTests(unittest.TestCase):
    def test_direct_private_link_join(self):
        self.assertTrue(
            JoinRouterModule.is_join_transition(
                member("left"),
                member("member"),
            )
        )

    def test_approved_join_request(self):
        self.assertTrue(
            JoinRouterModule.is_join_transition(
                member("left"),
                member("restricted", True),
            )
        )

    def test_restricted_non_member_is_not_a_join(self):
        self.assertFalse(
            JoinRouterModule.is_join_transition(
                member("left"),
                member("restricted", False),
            )
        )

    def test_permission_change_is_not_a_join(self):
        self.assertFalse(
            JoinRouterModule.is_join_transition(
                member("member"),
                member("administrator"),
            )
        )

    def test_member_leave(self):
        self.assertTrue(
            JoinRouterModule.is_leave_transition(
                member("member"),
                member("left"),
            )
        )

    def test_restricted_member_becomes_non_member(self):
        self.assertTrue(
            JoinRouterModule.is_leave_transition(
                member("restricted", True),
                member("restricted", False),
            )
        )


if __name__ == "__main__":
    unittest.main()
