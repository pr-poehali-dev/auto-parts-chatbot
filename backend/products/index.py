import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


SCHEMA = "t_p78841365_auto_parts_chatbot"


def handler(event: dict, context) -> dict:
    """Управление товарами каталога автозапчастей: CRUD операции"""
    cors = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
    }

    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": cors, "body": ""}

    method = event.get("httpMethod", "GET")
    params = event.get("queryStringParameters") or {}
    body = {}
    if event.get("body"):
        body = json.loads(event["body"])

    conn = get_conn()
    cur = conn.cursor(cursor_factory=RealDictCursor)

    try:
        if method == "GET":
            search = params.get("search", "")
            car = params.get("car", "")

            query = f"SELECT * FROM {SCHEMA}.products WHERE 1=1"
            args = []

            if search:
                query += " AND (name ILIKE %s OR article ILIKE %s)"
                args += [f"%{search}%", f"%{search}%"]

            if car:
                query += " AND %s = ANY(compatible_cars)"
                args.append(car)

            query += " ORDER BY created_at DESC"
            cur.execute(query, args)
            products = cur.fetchall()

            return {
                "statusCode": 200,
                "headers": cors,
                "body": json.dumps({"products": [dict(p) for p in products]}, ensure_ascii=False, default=str),
            }

        elif method == "POST":
            cur.execute(
                f"""INSERT INTO {SCHEMA}.products (name, article, compatible_cars, description, price, stock_quantity)
                    VALUES (%s, %s, %s, %s, %s, %s) RETURNING *""",
                (
                    body.get("name"),
                    body.get("article"),
                    body.get("compatible_cars", []),
                    body.get("description", ""),
                    body.get("price"),
                    body.get("stock_quantity", 0),
                ),
            )
            conn.commit()
            product = dict(cur.fetchone())
            return {
                "statusCode": 201,
                "headers": cors,
                "body": json.dumps({"product": product}, ensure_ascii=False, default=str),
            }

        elif method == "PUT":
            product_id = body.get("id")
            cur.execute(
                f"""UPDATE {SCHEMA}.products
                    SET name=%s, article=%s, compatible_cars=%s, description=%s,
                        price=%s, stock_quantity=%s, updated_at=NOW()
                    WHERE id=%s RETURNING *""",
                (
                    body.get("name"),
                    body.get("article"),
                    body.get("compatible_cars", []),
                    body.get("description", ""),
                    body.get("price"),
                    body.get("stock_quantity", 0),
                    product_id,
                ),
            )
            conn.commit()
            product = cur.fetchone()
            if not product:
                return {"statusCode": 404, "headers": cors, "body": json.dumps({"error": "Товар не найден"})}
            return {
                "statusCode": 200,
                "headers": cors,
                "body": json.dumps({"product": dict(product)}, ensure_ascii=False, default=str),
            }

        elif method == "DELETE":
            product_id = params.get("id")
            cur.execute(f"DELETE FROM {SCHEMA}.products WHERE id=%s RETURNING id", (product_id,))
            conn.commit()
            deleted = cur.fetchone()
            if not deleted:
                return {"statusCode": 404, "headers": cors, "body": json.dumps({"error": "Товар не найден"})}
            return {
                "statusCode": 200,
                "headers": cors,
                "body": json.dumps({"success": True}),
            }

    finally:
        cur.close()
        conn.close()
