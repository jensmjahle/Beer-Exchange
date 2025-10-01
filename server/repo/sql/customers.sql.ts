// repo/sql/customers.sql.ts
export const LIST_CUSTOMERS = `
  SELECT id, event_id, name, phone,
         shoe_size, weight, profile_image_url, work_relationship,
         gender, sexual_orientation, ethnicity, experience_level
  FROM customer
  WHERE event_id = ?
  ORDER BY name
`;
