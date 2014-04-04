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
  from_id                   bigint not null,
  to_argument_id            bigint,
  to_relation_id            bigint,
  type                      integer not null,
  constraint pk_relation primary key (id))
;

create sequence argument_seq;

create sequence relation_seq;

alter table relation add constraint fk_relation_from_1 foreign key (from_id) references argument (id);
create index ix_relation_from_1 on relation (from_id);
alter table relation add constraint fk_relation_toArgument_2 foreign key (to_argument_id) references argument (id);
create index ix_relation_toArgument_2 on relation (to_argument_id);
alter table relation add constraint fk_relation_toRelation_3 foreign key (to_relation_id) references relation (id);
create index ix_relation_toRelation_3 on relation (to_relation_id);



# --- !Downs

drop table if exists argument cascade;

drop table if exists relation cascade;

drop sequence if exists argument_seq;

drop sequence if exists relation_seq;

