create or replace FUNCTION getDistrict(
    loc INTEGER
)
RETURNS VARCHAR AS $$
DECLARE
    dist_name VARCHAR;
BEGIN
    SELECT d.districtname into dist_name
    FROM (Locations L JOIN thanas T on L.thanaid = T.thanaid) JOIN districts d on T.districtid = d.districtid
    WHERE L.locationid = loc;
    return dist_name;
END;
$$ LANGUAGE plpgsql;

select getDistrict(3);