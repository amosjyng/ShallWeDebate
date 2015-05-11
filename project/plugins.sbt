// Comment to get more information during initialization
logLevel := Level.Warn

// The Typesafe repository
resolvers += "Typesafe repository" at "http://repo.typesafe.com/typesafe/releases/"

// Use the Play sbt plugin for Play projects
addSbtPlugin("com.typesafe.play" % "sbt-plugin" % "2.3.4")

// Sass
resolvers += "Sonatype OSS Releases" at "https://oss.sonatype.org/content/repositories/releases"

addSbtPlugin("com.typesafe.sbt" % "sbt-less" % "1.0.6")