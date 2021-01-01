### Questions

-   no trap?
-   no attribute?
-   how to tell if an value is a null?
-   no fill function?
-   how to tell difference between datetime and time, datehour and hour etc?
-   how to parse datetime type?
-   no data type for \`b\`e\`g?

### Data Types

| data type           | @    | Example                     | infinity | null |
| ------------------- | ---- | --------------------------- | -------- | ---- |
| char                | \`c  | "a"                         | -        | -    |
| name                | \`n  | \`a                         | -        | -    |
| int                 | \`i  | 1                           | 0W/-0W   | 0N   |
| float               | \`f  | 1.                          | 0w/-0w   | 0n   |
| date                | \`d  | 2020.01.01                  | -        | -    |
| datehour            | \`h  | 2020.01.01T00:              | -        | -    |
| dateminute          | \`r  | 2020.01.01T00:00            | -        | -    |
| datesecond          | \`s  | 2020.01.01T00:00:00         | -        | -    |
| datetime            | \`t  | 2020.01.01T00:00:00.000     | -        | -    |
| hour                | \`h  | 00:                         | -        | -    |
| minute              | \`r  | 00:00                       | -        | -    |
| second              | \`s  | 00:00:00                    | -        | -    |
| time                | \`t  | 00:00:00.0                  | -        | -    |
| dictionary          | \`a  | \`sym\`qty!(\`a;1)          | -        | -    |
| table               | \`A  | ,\`sym\`qty!(\`a;1)         | -        | -    |
| function            | \`.  | {x+y}                       | -        | -    |
| string              | \`C  | "ab"                        | -        | -    |
| names               | \`N  | \`a\`b                      | -        | -    |
| ints                | \`I  | 1 2                         | 0W/-0W   | 0N   |
| floats              | \`F  | 1. 2.                       | 0w/-0w   | 0n   |
| dates               | \`D  | 2020.01.01+!2               | -        | -    |
| datehours           | \`H  | 2020.01.01T00:+!2           | -        | -    |
| dateminutes         | \`R  | 2020.01.01T00:00+!2         | -        | -    |
| dateseconds         | \`S  | 2020.01.01T00:00:00+!2      | -        | -    |
| datetimes           | \`T  | 2020.01.01T00:00:00.000+!2  | -        | -    |
| hours               | \`H  | 00:+!2                      | -        | -    |
| minutes             | \`R  | 00:00+!2                    | -        | -    |
| seconds             | \`S  | 00:00:00+!2                 | -        | -    |
| times               | \`T  | 00:00:00.0+!2               | -        | -    |
| list of string      | \`LC | ,"ab"                       | -        | -    |
| list of names       | \`LN | ,\`a\`b                     | -        | -    |
| list of ints        | \`LI | ,1 2                        | 0W/-0W   | 0N   |
| list of floats      | \`LF | ,1. 2.                      | 0w/-0w   | 0n   |
| list of dates       | \`LD | ,2020.01.01+!2              | -        | -    |
| list of datehours   | \`LH | ,2020.01.01T00:+!2          | -        | -    |
| list of dateminutes | \`LR | ,2020.01.01T00:00+!2        | -        | -    |
| list of dateseconds | \`LS | ,2020.01.01T00:00:00+!2     | -        | -    |
| list of datetimes   | \`LT | ,2020.01.01T00:00:00.000+!2 | -        | -    |
| list of hours       | \`LH | ,00:+!2                     | -        | -    |
| list of minutes     | \`LR | ,00:00+!2                   | -        | -    |
| list of seconds     | \`LS | ,00:00:00+!2                | -        | -    |
| list of times       | \`LT | ,00:00:00.0+!2              | -        | -    |

#### Parse String -

\`i$string

```
`i$"123"
`i$("123";"456")
```

#### Cast Type

\`i value

```
`i 2020.01.01
```

#### Keyed Table

```
`a key +`a`b!2^!6
[[a:!3]b:3+!3]
```

#### String Operations

-   join `c/`: `"-"/("ab";"cd";"ef")`
-   split `c\`: `"-"/"ab-cd-ef"`

#### Set Operations

-   take(inter) `#`: `(1 3 5 7)#!4`
-   drop(except)`_`: `(1 3 5 7)_!4`
-   has `'`:

```
`a`b`c'`a`b`x`y             \1100b
(1 2;4 5 6;7 9)'(1 2;8 9)   \10b
```

-   bin `':`:

```
l:(5;{x*x})\:1.01           \1.01 1.0201 1.040604 1.082857 1.172578 1.37494
l':1.025                    \
l':'1.025 1.1               \
```
