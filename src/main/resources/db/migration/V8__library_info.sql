-- Malangeni Library's public details, edited by the hub team. Always exactly one row, id 'main'.
-- A null opening/closing pair means closed that day.

CREATE TABLE IF NOT EXISTS library_info (
    id varchar(255) not null,
    name varchar(255) not null,
    about varchar(1000),
    location varchar(255),
    maps_url varchar(512),
    weekday_open time(6),
    weekday_close time(6),
    saturday_open time(6),
    saturday_close time(6),
    sunday_open time(6),
    sunday_close time(6),
    updated_at timestamp(6),
    updated_by_user_id varchar(255),
    primary key (id)
);

-- Starting values; the hub team replaces them from /staff -> Library.
INSERT INTO library_info (id, name, about, location, maps_url,
                          weekday_open, weekday_close, saturday_open, saturday_close)
VALUES ('main', 'Malangeni Library', 'Books to borrow and a quiet place to read.', 'Malangeni',
        'https://www.google.com/maps/search/?api=1&query=Malangeni+Library',
        '08:00', '20:00', '09:00', '13:00')
ON CONFLICT (id) DO NOTHING;
