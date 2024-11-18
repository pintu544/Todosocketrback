const express = require("express");
const router = express.Router();
const {
  allAccess,
  userBoard,
  adminBoard,

  allUsers,
} = require("../controllers/user.controller");
const { authJwt } = require("../middlewares/auth/authJwt");

/**
 * @des All Access:
 */
router.get("/all-access", allAccess);

/**
 * @des  Access User:
 */
router.get("/access-user", userBoard);

/**
 * @des  Access Admin:
 */
router.get("/access-admin", [authJwt.verifyToken, authJwt.isAdmin], adminBoard);

/**
 * @des  Access users:
 */
router.get("/all-users/:id", [authJwt.verifyToken], allUsers);

module.exports = router;
