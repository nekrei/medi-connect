--function 01
create or replace FUNCTION getDistrict(loc INTEGER)
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

--function 02
create or replace FUNCTION getDistSq(
    lat1 numeric, lng1 numeric, lat2 numeric, lng2 numeric
)
rETURNS numeric AS $$
DECLARE
    dist numeric;
BEGIN
    dist := (lat1 - lat2)*(lat1 - lat2) + (lng1 - lng2)*(lng1 - lng2);
    return dist;
END;
$$ LANGUAGE plpgsql;

select getDistSq(23.8103, 90.4125, 23.7806, 90.4074);

--function 03
create or replace function addressString(
    loc INTEGER
)
returns VARCHAR AS $$
DECLARE
    addr VARCHAR;
BEGIN
    SELECT (
        coalesce(propertyname || ', ' , '') ||
        coalesce(holdingnumber || ', ' , '') ||
        coalesce(road || ', ' , '') ||
        coalesce(thananame || ', ' , '') ||
        coalesce(districtname || '-' , '') ||
        coalesce(postalcode, '')
        ) into addr
    FROM (Locations L JOIN thanas T on L.thanaid = T.thanaid) JOIN districts d on T.districtid = d.districtid
    WHERE L.locationid = loc;
    return addr;
END;
$$ LANGUAGE plpgsql;

SELECT addressString(3);

insert into hospitals (locationid, hospitalname) values (3, 'B Medical');
update locations set latitude = 23.7512408, longitude = 90.3711621
where locationid = 3;

select latitude, longitude, hospitalname,
addressString(locations.locationid) as address
from (hospitals join locations on hospitals.locationid = locations.locationid)
--order by getdistsq(23, 90, latitude, longitude) asc
limit 30;



CREATE OR REPLACE FUNCTION get_doctor_specializations(doctor_id INTEGER)
RETURNS TEXT[] AS $$
DECLARE
    specializations TEXT[];
BEGIN
    SELECT ARRAY_AGG(s.specializationname)
    INTO specializations
    FROM doctorspecializations ds
    JOIN specializations s ON ds.specializationid = s.specializationid
    WHERE ds.doctorid = doctor_id;
    
    RETURN specializations;
END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION get_chamber_available_days(chamber_id integer)
RETURNS integer[] AS $$
DECLARE
    available_days integer[];
BEGIN
    SELECT ARRAY_AGG(DISTINCT weekday)
    INTO available_days
    FROM chamberschedules cs
    WHERE cs.chamberid = chamber_id
    AND cs.isactive = true;
    RETURN available_days;
END;
$$ LANGUAGE plpgsql;


 SELECT 
            d.doctorid,
            (u.firstname || ' ' || u.lastname) as name,
            array_to_string(get_doctor_specializations(d.doctorid), ', ') as specialization,
            h.hospitalname as hospital,
            dist.districtname as district,
            t.thananame as thana,
            COALESCE(AVG(r.rating)::float, 0) as avgrating,
            get_chamber_available_days(c.chamberid) as availabledays
        FROM chambers c 
        JOIN doctors d on c.doctorid = d.doctorid
        JOIN users u on d.doctorid = u.userid
        JOIN hospitals h on c.hospitalid = h.hospitalid
        JOIN locations l on h.locationid = l.locationid
        JOIN thanas t on l.thanaid = t.thanaid
        JOIN districts dist on t.districtid = dist.districtid
        LEFT JOIN reviews r on d.doctorid = r.doctorid
        
        GROUP BY
            d.doctorid, u.firstname, u.lastname, h.hospitalname, dist.districtname, t.thananame, c.chamberid
