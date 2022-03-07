from pprint import pprint

__author__ = "7715464, Allert"

res = {}

string_prefixes = {}
# String prefixes
string_prefixes["format_prefix"] = f"1 + 1 is {1 + 1}"
string_prefixes["byte_prefix"] = b"Byte String"
string_prefixes["unicode_prefix"] = u"Redundant unicode prefix"
string_prefixes["raw_prefix"] = r"This is a \n raw \n string"
res["string_prefixes"] = string_prefixes

integer_prefixes = {}
# Integer Prefixes
integer_prefixes["binary_prefix"] = f"{0b10} | {bin(2)}"  # 2
integer_prefixes["octal_prefix"] = f"{0o10} | {oct(8)}" # 8
integer_prefixes["hex_prefix"] = f"{0x10} | {hex(16)}" # 16
res["integer_prefixes"] = integer_prefixes

# Literal string concatenation without operator
res["odd_concatenation"] = "Why"' does'""' this'' even'" work"

string_comparisons = {}
# String comparison with > >= < <=
# character for character comparison of unicode position
string_comparisons["abexcl_lt_ac"] = "ab!" < "ac" # True
string_comparisons["abcde_leq_edcba"] = "abcde" <= "edcba" # True
string_comparisons["abcz_gt_zaaa"] = "abcz" > "aaaz" # True
string_comparisons["bbbaaa_geq_aaabbb"] = "aaabbb" >= "bbbaaa" # False

res["string_comparisons"] = string_comparisons

pprint(res, indent=2)