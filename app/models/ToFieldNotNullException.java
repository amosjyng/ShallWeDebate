package models;


public class ToFieldNotNullException extends Exception
{
    public ToFieldNotNullException()
    {
        super("Either toArgument or toRelation is already set!");
    }
}
