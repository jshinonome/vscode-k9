/
noun
char " ab"              \l a.k
name ``ab               \t:n x
int  0 2 3              \u:n x
flt  0 2 3.             \v
date 2021.01.23   .z.d
time 12:34:56.789 .z.t
\
t:{x,("fail";"pass")@y}
/ parse string
t["parse name               :";`abc=`n$"abc"]
t["parse name(use 'n')      :";`abc="n"$"abc"]
t["parse int                :";123=`i$"123"]
t["parse float              :";123.0=`f$"123.0"]
t["parse date               :";2020.12.30=`d$"2020.12.30"]
t["parse date(test string)  :";"2020.12.30"~$`d$"2020.12.30"]
t["parse time(milisecond)   :";03:29:30.717=`t$"03:29:30.717"]
t["parse time(nanosecond)   :";03:29:30.123456789=`t$"03:29:30.123456789"]
t["parse int                :";97=`i "a"]

/ .z.d, z.t are UTC
/ unlike q, float in k9 shouldn't ended by ., because . is a operation