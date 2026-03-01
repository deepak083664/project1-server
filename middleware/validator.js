const { check, validationResult } = require('express-validator');

// Validation middleware generator
const validate = (validations) => {
    return async (req, res, next) => {
        for (let validation of validations) {
            const result = await validation.run(req);
            if (result.errors.length) break;
        }

        const errors = validationResult(req);
        if (errors.isEmpty()) {
            return next();
        }

        res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: errors.array()
        });
    };
};

// Example Schemas
const registerSchema = [
    check('name', 'Name is required').not().isEmpty().trim().escape(),
    check('email', 'Please include a valid email').isEmail().normalizeEmail(),
    check('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 })
];

const loginSchema = [
    check('email', 'Please include a valid email').isEmail().normalizeEmail(),
    check('password', 'Password is required').exists()
];

const productSchema = [
    check('name', 'Product name is required').not().isEmpty().trim().escape(),
    check('price', 'Price must be a positive number').isFloat({ min: 0 }),
    check('category', 'Category is required').not().isEmpty()
];

module.exports = {
    validate,
    registerSchema,
    loginSchema,
    productSchema
};
