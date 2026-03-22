# Contributing

This repository is part of the Openstrux project. Contributions are welcome.

## How to contribute

1. Open an issue describing the change you want to make.
2. Fork the repository and create a branch.
3. Make your changes, ensuring all tests pass.
4. Submit a pull request referencing the issue.

## Code style

- TypeScript strict mode, no `any` types.
- Zod for all external input validation.
- Follow existing naming conventions (see `prompts/shared/constraints.md`).

## Testing

Run `pnpm test` to execute unit and integration tests. Integration tests require a running PostgreSQL instance (see `.env.example`).

## License

By contributing, you agree that your contributions will be licensed under the EUPL v1.2.
