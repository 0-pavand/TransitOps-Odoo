# TransitOps API

1. Create the local PostgreSQL database: `createdb transitops`.
2. From `backend`, create and activate a virtual environment, then run `pip install -r requirements.txt`.
3. Review `.env`, run `alembic upgrade head`, then start the API with `uvicorn main:app --reload`.

The API starts at `http://localhost:8000`, creates its tables, and seeds the four specified users. Their password is `password123`. The React services now call this API and translate its snake_case transport fields to the existing camelCase UI models.
