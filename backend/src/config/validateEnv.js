import Joi from "joi";

const envSchema = Joi.object({
    PORT: Joi.number().required(),

    MONGO_URI: Joi.string().required(),

    JWT_SECRET: Joi.string().required(),

    NODE_ENV: Joi.string()
        .valid("development", "production")
        .required(),
})
    .unknown()
    .required();

const { error } = envSchema.validate(process.env);

if (error) {
    throw new Error(`Environment Validation Error: ${error.message}`);
}