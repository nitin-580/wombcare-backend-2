import rateLimit from 'express-rate-limit';

export const signupLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 5, // Limit each IP to 5 signup requests per windowMs
  message: {
    success: false,
    message: 'Too many registration requests from this IP, please try again after a minute',
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});
