# --- Created by Ebean DDL
# To stop Ebean DDL generation, remove this comment and start using Evolutions

# --- !Ups

create table argument (
  id                        bigint not null,
  summary                   varchar(140),
  constraint pk_argument primary key (id))
;

create table relation (
  id                        bigint not null,
  to_id                     bigint,
  type                      integer,
  constraint pk_relation primary key (id))
;

create sequence argument_seq;

create sequence relation_seq;




# --- !Downs

drop table if exists argument cascade;

drop table if exists relation cascade;

drop sequence if exists argument_seq;

drop sequence if exists relation_seq;

