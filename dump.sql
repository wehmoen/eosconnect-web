
create table apps(
	id int auto_increment
		primary key,
	name varchar(12) not null,
	description varchar(2048) null,
	logo mediumtext not null,
	redirect_uri json not null,
	owner varchar(12) default 'steemthebest' not null,
	constraint apps_name_uindex
		unique (name)
);


create table token (
	id int auto_increment
		primary key,
	account varchar(12) not null,
	token varchar(512) null,
	created datetime null,
	client_id varchar(12) null
);

