# --- Created by Ebean DDL
# To stop Ebean DDL generation, remove this comment and start using Evolutions

# --- !Ups

create table argument (
  id                        bigint not null,
  summary                   varchar(255),
  constraint pk_argument primary key (id))
;

create sequence argument_seq;




# --- !Downs

drop table if exists argument cascade;

drop sequence if exists argument_seq;

