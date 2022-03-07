import random
from typing import List, Tuple

__author__ = "7715464, Allert"

BITS = 8 # Bits before and after the decimal point

def str_to_int_list(str_list: List[str]) -> List[int]:
    return list(map(
        lambda x: int(x), str_list
    ))

def decimals_to_float(bin_decimals: List[int]) -> float:
    result = 0.
    for power, digit in enumerate(bin_decimals, start=1):
        result += digit * (2 ** (-1 * power))
    return result

def ints_to_float(bin_ints: List[int]) -> float:
    result = 0
    for power, digit in enumerate(bin_ints, start=1):
        result += digit * (2 ** (len(bin_ints) - power))
    return result

def generate_random_number() -> Tuple[str, float]:
    is_negative = random.randint(0, 1)
    non_decimal = [random.randint(0, 1) for _ in range(BITS)]
    decimal = [random.randint(0, 1) for _ in range(BITS)]
    return (
        f"{'-' * is_negative}{''.join(map(lambda x: str(x), non_decimal))}.{''.join(map(lambda x: str(x), decimal))}", 
        (-1 ** is_negative) * (decimals_to_float(decimal) + ints_to_float(non_decimal))
    )

def decimals_to_bin(decimals: float, bits = BITS) -> str:
    result = []
    while True:
        decimals *= 2
        result.append(str(int(decimals >= 1)))
        if decimals >= 1: decimals -= 1
        if len(result) == bits: break
    return "".join(result)

def ints_to_bin(ints: int, bits = BITS) -> str:
    result = []
    while True:
        ints, mod = divmod(ints, 2)
        result.append(str(mod))
        if len(result) == bits: break
    result.reverse()
    return "".join(result)

def float_to_ieee_754(number: float) -> str:
    sign = str(int(number < 0))
    number = abs(number)
    ints, decimals = int(number), number - int(number)
    bin_ints, bin_decimals = ints_to_bin(ints), decimals_to_bin(decimals)
    pre_mantissa = f"{bin_ints}.{bin_decimals}{''.zfill(23)}"
    int_exponent = pre_mantissa.index(".") - pre_mantissa.index("1") - 1 + 127
    exponent = ints_to_bin(int_exponent, 8)
    mantissa = f'{pre_mantissa[pre_mantissa.index("1") + 1:-1].replace(".", "")}{"".zfill(23)}'[:23]
    return ((sign, exponent, mantissa), sign + exponent + mantissa, int_exponent - 127)

def ieee_754_to_float(binary: str) -> float:
    sign, exponent, mantissa = binary[0], binary[1:9], ''.zfill(127) + "1" + binary[9:32] + ''.zfill(127)
    int_exponent = ints_to_float(str_to_int_list(exponent)) - 127
    post_mantissa = f"{mantissa[:127 + int_exponent + 1]}.{mantissa[127 + int_exponent + 1:127 + 32 - (int_exponent + 1)]}"
    print(str_to_int_list(exponent), int_exponent, binary[9:32])
    return ((int(sign) + (int(sign) == 0) - (2 * int(sign) == 1)) *
            (ints_to_float(str_to_int_list(post_mantissa.split(".")[0])) +
             decimals_to_float(str_to_int_list(post_mantissa.split(".")[1])))
           )