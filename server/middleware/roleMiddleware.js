/**
 * Restricts access to one or more specified roles
 * @param  {...string} roles - e.g. 'coordinator', 'hod', 'faculty', 'student'
 */
function authorizeRoles(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthenticated user. Please sign in.'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Operation requires one of the following roles: [${roles.join(', ')}]. Current role: '${req.user.role}'.`
      });
    }

    next();
  };
}

module.exports = authorizeRoles;
