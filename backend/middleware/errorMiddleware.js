// example code
// backend/middleware/errorMiddleware.js
// const errorHandler = (err, req, res, next) => {
//   // If the status code is 200 but an error is thrown, default to 500 (Server Error)
//   const statusCode = res.statusCode ? res.statusCode : 500;

//   res.status(statusCode).json({
//     message: err.message,
//     // Only show the detailed stack trace when you are testing locally
//     stack: process.env.NODE_ENV === 'production' ? null : err.stack,
//   });
// };

// module.exports = { errorHandler };