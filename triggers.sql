create or replace function reject_doctor() returns trigger as $rejected_doctor_handler$
    DECLARE
    BEGIN


create or replace trigger rejected_doctor_handler
after update
of approvalstatus
on doctors
for each row 