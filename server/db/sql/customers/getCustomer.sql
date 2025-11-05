SELECT id,event_id,name,phone,
       shoe_size,weight,profile_image_url,work_relationship,
       gender,sexual_orientation,ethnicity,experience_level
FROM customer
WHERE id=$1 AND event_id=$2;
