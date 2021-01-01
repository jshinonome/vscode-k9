/
   adverb
   f' each
[x]f/ over (c/join)
[x]f\ scan (c\split)
[x]f':eachp
   f/:eachr g/:over
   f\:eachl g\:scan
\

t:{x,("fail";"pass")@y};
t["test each(f')              :";(0 1 4 9 16)~{x*x}'!5]
t["test each both(v'v)        :";"be"~("abc";"cde")@'1 2]
t["test each prior(f':)       :";(0 1 3 5 7)~+':!5]
t["test each parallel(f':)    :";(0 1 4 9 16)~{x*x}':!5]
t["test over(f/)              :";120=*/1+!5]
t["test scan(f\)              :";(1 2 6 24 120)~*\1+!5]
t["test join(c/)              :";"2020-12-30"~"-"/$2020 12 30]
t["test split(c\)             :";(2020 12 30)~"i"$"-"\"2020-12-30"]
t["test by base(i/)           :";5=2/1 0 1]
t["test base(i\)              :";(1 0 1)~2\5]
t["test eachr(f/:)            :";{x*x}(@)/:!5]
t["test eachr(f/:)            :";("prefix_0";"prefix_1")~"prefix_",/:$!2]
t["test eachl(f\:)            :";(2 1)~({x+x};{x*x})@\:1]
t["test over((n;f)/:) for     :";256=(3;{x*x})/:2]
t["test scan((n;f)\:) for     :";(2 4 16 256)~(3;{x*x})\:2]
t["test over((c;f)/:) while   :";16=(10>;{x*x})/:2]
t["test scan((c;f)\:) while   :";(2 4 16)~(10>;{x*x})\:2]
/ until f(x)=x
t["test over((n;f)/:) converge:";(0 1 0 1 0)~{x*x}/:!5]

/ {x*x}@/:!5, {x*x}'!5, {x*x}@!5
/ why {x*x}/:!5 returns 0 1 0 1 0?
/ difference between 40>(function), and <40(!class)
