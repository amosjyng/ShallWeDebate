name := "ShallWeDebate"

version := "1.0-SNAPSHOT"

resolvers += Resolver.url("Objectify Play Repository", url("http://deadbolt.ws/releases/"))(Resolver.ivyStylePatterns)

resolvers += Resolver.url("Objectify Play Repository (release)", url("http://schaloner.github.io/releases/"))(Resolver.ivyStylePatterns)

resolvers += Resolver.url("Objectify Play Repository (snapshot)", url("http://schaloner.github.io/snapshots/"))(Resolver.ivyStylePatterns)

resolvers += Resolver.url("play-easymail (release)", url("http://joscha.github.io/play-easymail/repo/releases/"))(Resolver.ivyStylePatterns)

resolvers += Resolver.url("play-easymail (snapshot)", url("http://joscha.github.io/play-easymail/repo/snapshots/"))(Resolver.ivyStylePatterns)

resolvers += Resolver.url("play-authenticate (release)", url("http://joscha.github.io/play-authenticate/repo/releases/"))(Resolver.ivyStylePatterns)

resolvers += Resolver.url("play-authenticate (snapshot)", url("http://joscha.github.io/play-authenticate/repo/snapshots/"))(Resolver.ivyStylePatterns)

libraryDependencies ++= Seq(
  javaCore,
  javaJdbc,
  javaEbean,
  "be.objectify" %% "deadbolt-java"     % "2.3.2",
  "com.feth"     %% "play-authenticate" % "0.6.8",
  "postgresql"   %  "postgresql"        % "9.1-901-1.jdbc4",
  cache
)     

lazy val root = project.in(file("."))
  .enablePlugins(PlayJava, SbtWeb)

