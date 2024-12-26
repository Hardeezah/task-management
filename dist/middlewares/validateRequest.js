"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateRequest = void 0;
const validateRequest = (schema) => {
    return (req, res, next) => {
        const { error } = schema.validate(req.body, { abortEarly: false });
        if (error) {
            res.status(400).json({
                message: 'Validation error',
                details: error.details.map((detail) => detail.message),
            });
        }
        else {
            next(); // Call next if validation is successful
        }
    };
};
exports.validateRequest = validateRequest;
//# sourceMappingURL=validateRequest.js.map