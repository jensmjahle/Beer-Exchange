UPDATE customer
SET name=$1, phone=$2, shoe_size=$3, weight=$4, profile_image_url=$5, work_relationship=$6,
    gender=$7, sexual_orientation=$8, ethnicity=$9, experience_level=$10
WHERE id=$11 AND event_id=$12;
