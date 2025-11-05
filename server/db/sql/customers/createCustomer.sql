INSERT INTO customer (
  id,event_id,name,phone,
  shoe_size,weight,profile_image_url,work_relationship,
  gender,sexual_orientation,ethnicity,experience_level
)
VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12);
