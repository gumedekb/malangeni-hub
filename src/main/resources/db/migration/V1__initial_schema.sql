-- Baseline schema, generated from the JPA entities on 2026-08-01 (TASKS.md 12.6).
--
-- This reproduces what ddl-auto=update had built up in Neon by that date. Existing
-- databases are marked as already at V1 via spring.flyway.baseline-on-migrate, so this
-- file only ever runs against a brand-new empty database.
--
-- Do not edit: Flyway checksums applied migrations and will refuse to start if this
-- changes. Schema changes go in a new V<n>__ file.


    create table attractions (
        category_id varchar(255),
        description TEXT,
        id varchar(255) not null,
        image_url varchar(255),
        latitude varchar(255),
        location varchar(255) not null,
        longitude varchar(255),
        name varchar(255) not null,
        primary key (id)
    );

    create table categories (
        id varchar(255) not null,
        name varchar(255) not null unique,
        primary key (id)
    );

    create table comments (
        created_at timestamp(6) not null,
        author_id varchar(255) not null,
        body TEXT not null,
        id varchar(255) not null,
        parent_comment_id varchar(255),
        post_id varchar(255) not null,
        primary key (id)
    );

    create table community_groups (
        description TEXT,
        icon varchar(255),
        id varchar(255) not null,
        name varchar(255) not null unique,
        primary key (id)
    );

    create table community_projects (
        category_id varchar(255),
        description TEXT,
        id varchar(255) not null,
        image_url varchar(255),
        organiser varchar(255),
        title varchar(255) not null,
        primary key (id)
    );

    create table contact_messages (
        date_sent timestamp(6) not null,
        id varchar(255) not null,
        message TEXT not null,
        subject varchar(255) not null,
        user_id varchar(255),
        primary key (id)
    );

    create table events (
        created_at timestamp(6) not null,
        start_at timestamp(6) not null,
        description TEXT,
        id varchar(255) not null,
        location varchar(255) not null,
        organiser_id varchar(255),
        tag varchar(255) not null check (tag in ('IMPORTANT','FUN')),
        title varchar(255) not null,
        primary key (id)
    );

    create table group_memberships (
        joined_at timestamp(6) not null,
        group_id varchar(255) not null,
        id varchar(255) not null,
        user_id varchar(255) not null,
        primary key (id),
        unique (group_id, user_id)
    );

    create table likes (
        created_at timestamp(6) not null,
        id varchar(255) not null,
        post_id varchar(255) not null,
        user_id varchar(255) not null,
        primary key (id),
        unique (post_id, user_id)
    );

    create table local_services (
        address varchar(255),
        category_id varchar(255),
        email varchar(255),
        id varchar(255) not null,
        name varchar(255) not null,
        phone varchar(255),
        primary key (id)
    );

    create table news (
        published_at timestamp(6) not null,
        author_id varchar(255),
        category_id varchar(255),
        content TEXT not null,
        id varchar(255) not null,
        image_url varchar(255),
        title varchar(255) not null,
        primary key (id)
    );

    create table posts (
        created_at timestamp(6) not null,
        author_id varchar(255) not null,
        body TEXT not null,
        group_id varchar(255),
        id varchar(255) not null,
        image_url varchar(255),
        title varchar(255) not null,
        type varchar(255) not null check (type in ('COMMUNITY','NEWS','NOTICE','JOB','INFORMATIONAL')),
        primary key (id)
    );

    create table products (
        availability_enforced boolean not null,
        available boolean not null,
        price numeric(38,2),
        created_at timestamp(6) not null,
        description TEXT,
        id varchar(255) not null,
        image_url varchar(255),
        name varchar(255) not null,
        shop_id varchar(255) not null,
        primary key (id)
    );

    create table ratings (
        score integer not null,
        created_at timestamp(6) not null,
        attraction_id varchar(255) not null,
        comment TEXT,
        id varchar(255) not null,
        user_id varchar(255) not null,
        primary key (id),
        unique (attraction_id, user_id)
    );

    create table shops (
        active boolean not null,
        approved boolean not null,
        closing_time time(6),
        opening_time time(6),
        created_at timestamp(6) not null,
        address varchar(255),
        category_id varchar(255),
        description TEXT,
        email varchar(255),
        id varchar(255) not null,
        latitude varchar(255),
        logo_url varchar(255),
        longitude varchar(255),
        name varchar(255) not null,
        owner_id varchar(255) not null,
        phone varchar(255),
        subdomain varchar(255) not null unique,
        primary key (id)
    );

    create table sponsors (
        active boolean not null,
        created_at timestamp(6) not null,
        end_at timestamp(6),
        start_at timestamp(6),
        id varchar(255) not null,
        image_url varchar(255),
        pitch TEXT,
        placement varchar(255) not null check (placement in ('HOME','EXPLORE','COMMUNITY','SERVICES','FEED')),
        shop_id varchar(255),
        target_url varchar(255),
        title varchar(255) not null,
        primary key (id)
    );

    create table users (
        banned_from_posting boolean not null,
        banned_at timestamp(6),
        created_at timestamp(6),
        profile_image_url varchar(512),
        ban_reason varchar(255),
        email varchar(255) not null unique,
        firebase_uid varchar(255) unique,
        id varchar(255) not null,
        password varchar(255),
        role varchar(255) check (role in ('ADMIN','USER','MODERATOR','SHOP_OWNER')),
        username varchar(255) not null unique,
        primary key (id)
    );

    alter table if exists attractions 
       add constraint FK5af7ti87jlo3d8910vogq2m80 
       foreign key (category_id) 
       references categories;

    alter table if exists comments 
       add constraint FKn2na60ukhs76ibtpt9burkm27 
       foreign key (author_id) 
       references users;

    alter table if exists comments 
       add constraint FKh4c7lvsc298whoyd4w9ta25cr 
       foreign key (post_id) 
       references posts;

    alter table if exists community_projects 
       add constraint FK7y3igbfbuuevrtfhhqy08hoxr 
       foreign key (category_id) 
       references categories;

    alter table if exists contact_messages 
       add constraint FKj305kltauaydco2n00yr55nbk 
       foreign key (user_id) 
       references users;

    alter table if exists events 
       add constraint FK59yigp8b4e4d9ggcdpkbvc89g 
       foreign key (organiser_id) 
       references users;

    alter table if exists group_memberships 
       add constraint FKckyr3qd1js1p05n7kx4pj5kkk 
       foreign key (group_id) 
       references community_groups;

    alter table if exists group_memberships 
       add constraint FKlq7o99bv8w6paut0ih5yhboia 
       foreign key (user_id) 
       references users;

    alter table if exists likes 
       add constraint FKry8tnr4x2vwemv2bb0h5hyl0x 
       foreign key (post_id) 
       references posts;

    alter table if exists likes 
       add constraint FKnvx9seeqqyy71bij291pwiwrg 
       foreign key (user_id) 
       references users;

    alter table if exists local_services 
       add constraint FKtn7xidmlhofu1kt82p394lrq5 
       foreign key (category_id) 
       references categories;

    alter table if exists news 
       add constraint FK3qvva8ftw201mxkeuirniflgb 
       foreign key (author_id) 
       references users;

    alter table if exists news 
       add constraint FK6itmfjj4ma8lfpj10jx24mhvx 
       foreign key (category_id) 
       references categories;

    alter table if exists posts 
       add constraint FK6xvn0811tkyo3nfjk2xvqx6ns 
       foreign key (author_id) 
       references users;

    alter table if exists posts 
       add constraint FKgvhkmq4qy44ltudbyinh0lekn 
       foreign key (group_id) 
       references community_groups;

    alter table if exists products 
       add constraint FK7kp8sbhxboponhx3lxqtmkcoj 
       foreign key (shop_id) 
       references shops;

    alter table if exists ratings 
       add constraint FKh32bxnyxll2a3te18ipo0dll9 
       foreign key (attraction_id) 
       references attractions;

    alter table if exists ratings 
       add constraint FKb3354ee2xxvdrbyq9f42jdayd 
       foreign key (user_id) 
       references users;

    alter table if exists shops 
       add constraint FKfl1w94m56gn5kaup1t0eiup41 
       foreign key (category_id) 
       references categories;

    alter table if exists shops 
       add constraint FKrduswa89ayj0poad3l70nag19 
       foreign key (owner_id) 
       references users;

    alter table if exists sponsors 
       add constraint FKikkd4f7brvabkn9qn3sr3uso6 
       foreign key (shop_id) 
       references shops;
