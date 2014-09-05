name := "ShallWeDebate"

version := "1.0-SNAPSHOT"

libraryDependencies ++= Seq(
  javaJdbc,
  javaEbean,
  "be.objectify"  %%  "deadbolt-java"     % "2.2.1-RC2",
  "com.feth"      %%  "play-authenticate" % "0.5.2-SNAPSHOT",
  "postgresql" % "postgresql" % "9.1-901-1.jdbc4",
  cache
)     

play.Project.playJavaSettings

net.litola.SassPlugin.sassSettings