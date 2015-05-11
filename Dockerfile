FROM ingensi/play-framework
MAINTAINER amosjyng@gmail.com

COPY . /app

RUN activator clean stage

CMD ["/app/target/universal/stage/bin/shallwedebate"]