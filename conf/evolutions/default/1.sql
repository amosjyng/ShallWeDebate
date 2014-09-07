# --- !Ups

create table argument (
  id                        bigint not null,
  creator_id                bigint not null,
  summary                   varchar(140),
  created_at                timestamp not null,
  constraint pk_argument primary key (id))
;

create table linked_account (
  id                        bigint not null,
  user_id                   bigint not null,
  provider_user_id          varchar(255),
  provider_key              varchar(255),
  constraint pk_linked_account primary key (id))
;

create table relation (
  id                        bigint not null,
  creator_id                bigint not null,
  from_id                   bigint not null,
  to_argument_id            bigint,
  to_relation_id            bigint,
  type                      integer not null,
  is_debated                boolean default false not null,
  created_at                timestamp not null,
  constraint pk_relation primary key (id))
;

create table security_role (
  id                        bigint not null,
  role_name                 varchar(255),
  constraint pk_security_role primary key (id))
;

create table subscriber (
  email                     varchar(255) not null,
  created_at                timestamp not null,
  constraint pk_subscriber primary key (email))
;

create table token_action (
  id                        bigint not null,
  token                     varchar(255),
  target_user_id            bigint,
  type                      varchar(2),
  created                   timestamp,
  expires                   timestamp,
  constraint ck_token_action_type check (type in ('EV','PR')),
  constraint uq_token_action_token unique (token),
  constraint pk_token_action primary key (id))
;

create table users (
  id                        bigint not null,
  email                     varchar(255),
  name                      varchar(255),
  first_name                varchar(255),
  last_name                 varchar(255),
  last_login                timestamp,
  active                    boolean,
  email_validated           boolean,
  constraint pk_users primary key (id))
;

create table user_permission (
  id                        bigint not null,
  value                     varchar(255),
  constraint pk_user_permission primary key (id))
;


create table users_security_role (
  users_id                       bigint not null,
  security_role_id               bigint not null,
  constraint pk_users_security_role primary key (users_id, security_role_id))
;

create table users_user_permission (
  users_id                       bigint not null,
  user_permission_id             bigint not null,
  constraint pk_users_user_permission primary key (users_id, user_permission_id))
;
create sequence argument_seq;

create sequence linked_account_seq;

create sequence relation_seq;

create sequence security_role_seq;

create sequence subscriber_seq;

create sequence token_action_seq;

create sequence users_seq;

create sequence user_permission_seq;

alter table argument add constraint fk_argument_creator_1 foreign key (creator_id) references users (id);
create index ix_argument_creator_1 on argument (creator_id);
alter table linked_account add constraint fk_linked_account_user_2 foreign key (user_id) references users (id);
create index ix_linked_account_user_2 on linked_account (user_id);
alter table relation add constraint fk_relation_creator_3 foreign key (creator_id) references users (id);
create index ix_relation_creator_3 on relation (creator_id);
alter table relation add constraint fk_relation_from_4 foreign key (from_id) references argument (id);
create index ix_relation_from_4 on relation (from_id);
alter table relation add constraint fk_relation_toArgument_5 foreign key (to_argument_id) references argument (id);
create index ix_relation_toArgument_5 on relation (to_argument_id);
alter table relation add constraint fk_relation_toRelation_6 foreign key (to_relation_id) references relation (id);
create index ix_relation_toRelation_6 on relation (to_relation_id);
alter table token_action add constraint fk_token_action_targetUser_7 foreign key (target_user_id) references users (id);
create index ix_token_action_targetUser_7 on token_action (target_user_id);



alter table users_security_role add constraint fk_users_security_role_users_01 foreign key (users_id) references users (id);

alter table users_security_role add constraint fk_users_security_role_securi_02 foreign key (security_role_id) references security_role (id);

alter table users_user_permission add constraint fk_users_user_permission_user_01 foreign key (users_id) references users (id);

alter table users_user_permission add constraint fk_users_user_permission_user_02 foreign key (user_permission_id) references user_permission (id);

# --- !Downs

drop table if exists argument cascade;

drop table if exists linked_account cascade;

drop table if exists relation cascade;

drop table if exists security_role cascade;

drop table if exists subscriber cascade;

drop table if exists token_action cascade;

drop table if exists users cascade;

drop table if exists users_security_role cascade;

drop table if exists users_user_permission cascade;

drop table if exists user_permission cascade;

drop sequence if exists argument_seq;

drop sequence if exists linked_account_seq;

drop sequence if exists relation_seq;

drop sequence if exists security_role_seq;

drop sequence if exists subscriber_seq;

drop sequence if exists token_action_seq;

drop sequence if exists users_seq;

drop sequence if exists user_permission_seq;

