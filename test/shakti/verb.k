/
verb
:   x          y
+   flip       plus
-   minus      minus
*   first      times
%              divide
&   where      min/and
|   reverse    max/or
<   asc        less
>   desc       more
=   group      equal
~   not        match
!   key        key
,   enlist     cat
^   sort    [f]cut
#   count   [f]take
_   floor   [f]drop
$   string     parse
?   unique  [n]find
@   type    [n]at
.   value      dot
\
t:{x,("fail";"pass")@y}
t["test return(:)               :";2={x+1;:2;x+2}[1]]
t["test assign(:)               :";2=a:2]
t["test flip(+) list            :";(1 4;2 5;3 6)~+(1 2 3;4 5 6)]
t["test flip(+) table           :";[[]a:1 2 3;b:4 5 6]~+`a`b!(1 2 3;4 5 6)]
t["test plus(+)                 :";2=1+1]
t["test plus(+) atom+list       :";(2 3)~1+1 2]
t["test plus(+) list+list       :";(2 4)~(1 2)+1 2]
t["test negate(-) atom          :";-1=0-1]
t["test negate(-) list          :";(0 -1 -2)~-(0 1 2)]
t["test minus(-)                :";-1=0-1]
t["test minus(-) atom-list      :";(0 -1)~1-1 2]
t["test minus(-) list-list      :";&/(1 1)=(2 3)-1 2]
t["test first(*) list           :";1=*1 2 3]
t["test first(*) dict           :";1=*(`a`b`c)!1 2 3]
t["test first(*) table          :";((`a`b)!1 4)~*+`a`b!(1 2 3;4 5 6)]
t["test times(*)                :";1=1*1]
t["test times(*) atom+list      :";(1 2)~1*1 2]
t["test times(*) list+list      :";(1 4)~(1 2)*1 2]
t["test divide(%)               :";1.0=1%1]
t["test divide(%) atom+list     :";&/(1.0 .5)=1%1 2]
t["test divide(%) list+list     :";&/(1.0 1.0)=(1 2)%1 2]
t["test match(~) atom~atom      :";`a~`a]
t["test match(~) list~list      :";(0 0)~(0 0)]
t["test match(~) list~list      :";(0 0)~(1 2)-1 2] /why this failed? (1.0 .5)~1%1 2
t["test where(&) bools          :";(0 3)~&1001b]
t["test where(&) ints           :";(1 1 3 3 3)~&0 2 0 3]
t["test and(&)                  :";0b=1b&0b]
t["test min(&)                  :";1=1&2]
t["test reverse(|) list         :";(3 0 2 0)~|0 2 0 3]
t["test or(&)                   :";1b=1b|0b]
t["test max(&)                  :";2=1|2]
t["test asc(<)                  :";(3 0 1 2)~ <2 3 4 1]
t["test less(<)                 :";1<2]
t["test desc(>)                 :";(2 1 0 3)~ >2 3 4 1]
t["test more(>)                 :";2>1]
t["test group(=)                :";(`a`b`c!(0 3;1 4; 2 5))~=`a`b`c`a`b`c]
t["test not(~)                  :";0b=~99]
t["test key(!)                  :";`a`b`c~!`a`b`c!(1 2 3)]
t["test enum(!)                 :";(0 1)~!2]
t["test enum(!)                 :";(0 0 1 1;0 1 0 1)~!2 2]
t["test enlist(,)               :";[[]a:,1;b:,2]~,`a`b!1 2]
t["test cat(,)                  :";"abc"~"a","bc"]
t["test sort(^)                 :";"abc"~^"bac"]
t["test cut(^)                  :";(,"b";"ac")~2^"bac"]
t["test cut(^)                  :";(0 1;2 3;4 5)~3^!6]
t["test cut(^) negative         :";(0 1 2;3 4 5)~ -3^!6]
t["test cut(^) indices          :";(1 2;3 4;,5)~1 3 5^!6]
t["test cut(^) f:bools          :";(,3 4 5)~{x=3}^!6]
t["test count(#)                :";1~#,1 2]
t["test take(#)                 :";(0 1)~2#0 1 2]
t["test take(#) negative        :";(1 2)~ -2#0 1 2]
t["test take(#) inter           :";(1 3)~(1 3 5)#0 1 2 3]
t["test take(#) filter          :";(0 1)~{x<2}#(0 1 2)]
t["test take(#) select          :";(+(,`a)!,0 1 2)~`a#+`a`b!(0 1 2;3 4 5)]
t["test floor(#)                :";1=_1.5]
t["test drop(_)                 :";(,2)~2_0 1 2]
t["test drop(_) negative        :";(,0)~ -2_0 1 2]
t["test drop(_) inter           :";(0 2)~(1 3 5)_0 1 2 3]
t["test drop(_) filter out      :";(,2)~{x<2}_(0 1 2)]
t["test string($)               :";"abc"~$`abc]
t["test parse($)                :";123="i"$"123"]
t["test unique(?)               :";`a`b`c~?`a`b`a`b`c]
t["test find(?)                 :";4=`a`b`a`b`c?`c]
t["test type(@)                 :";"f"=@1.0]
t["test at(@)                   :";`c=`a`b`a`b`c@4]
t["test value(.)                :";2=."1+1"]
t["test value(.)                :";2=.(+;1;1)]
t["test apply(.) index          :";1=(0;1;2;3).,1]
t["test apply(.) indices        :";(1 2)~(1;2;3;4) . ,0 1]
t["test apply(.) funciton       :";2=(+) . 1 1]
t["test apply(.) recursive      :";(7 3;5 1)=(1;3;5;7) . ,(3 1;2 0)]

/ given (1 2 3)1 = 2
/ what is (1 2 3)-1 ?
/ difference between (1 2 3)-1 and (1 2 3)@-1 and (1 2 3)(-1)
/ >= and <= not work