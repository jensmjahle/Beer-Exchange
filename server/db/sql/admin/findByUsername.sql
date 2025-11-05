SELECT * FROM admin_user
WHERE LOWER(username) = LOWER($1)
LIMIT 1;
