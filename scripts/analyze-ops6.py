#!/usr/bin/env python3
"""Compras 13 ago vs capital 6_635_000 Bs."""

PM = 0.003
CAPITAL = 6_635_000

buys = [
    (17.16, 880, 15100, "PagoMovil"),
    (16.94, 880, 14899, "PagoMovil"),
    (11.37, 880, 10000, "PagoMovil"),
    (12.50, 880, 11000, "PagoMovil"),
    (19.94, 880, 17537, "PagoMovil"),
    (21.60, 880, 19000, "PagoMovil"),
    (94.31, 880, 83000, "PagoMovil"),
    (99.94, 880, 87949, "PagoMovil"),
    (90.90, 880, 80000, "PagoMovil"),
    (59.43, 880, 52300, "PagoMovil"),
    (59.94, 879, 52688, "PagoMovil"),
    (78.39, 879, 68899, "PagoMovil"),
    (72.86, 879, 64038, "PagoMovil"),
    (69.94, 879, 61472, "PagoMovil"),
    (79.94, 879, 70261, "PagoMovil"),
    (102.39, 879, 90000, "PagoMovil"),
    (64.94, 877, 56963, "PagoMovil"),
    (97.41, 877, 85444, "PagoMovil"),
    (69.94, 877, 61349, "PagoMovil"),
    (99.80, 877, 87541, "PagoMovil"),
    (59.94, 877, 52577, "PagoMovil"),
    (100.66, 877, 88300, "PagoMovil"),
    (99.80, 877, 87541, "Banesco"),
    (79.84, 877, 69989, "PagoMovil"),
    (60.64, 876, 53100, "PagoMovil"),
    (59.94, 876, 52484, "PagoMovil"),
    (64.94, 876, 56901, "PagoMovil"),
    (57.06, 876, 50000, "PagoMovil"),
    (68.94, 876, 60406, "PagoMovil"),
    (57.94, 876, 50768, "PagoMovil"),
    (57.06, 876, 50000, "PagoMovil"),
    (57.06, 876, 50000, "PagoMovil"),
    (57.06, 876, 50000, "PagoMovil"),
    (57.06, 876, 50000, "PagoMovil"),
    (96.17, 876, 84200, "PagoMovil"),
    (228.43, 876, 200000, "PagoMovil"),
    (99.99, 876, 87550, "PagoMovil"),
    (102.79, 876, 90000, "PagoMovil"),
    (99.94, 876, 87498, "PagoMovil"),
    (99.37, 876, 87000, "PagoMovil"),
    (59.94, 875, 52420, "PagoMovil"),
    (72.03, 875, 63000, "PagoMovil"),
    (57.17, 875, 50000, "PagoMovil"),
    (59.94, 875, 52419, "PagoMovil"),
    (64.09, 874, 56000, "PagoMovil"),
    (64.94, 874, 56739, "PagoMovil"),
    (59.94, 872, 52277, "PagoMovil"),
    (97.81, 872, 85297, "PagoMovil"),
    (94.94, 872, 82794, "PagoMovil"),
    (98.48, 873, 86000, "PagoMovil"),
    (154.69, 873, 135086, "PagoMovil"),
    (99.94, 874, 87339, "PagoMovil"),
    (199.94, 874, 174730, "PagoMovil"),
    (199.94, 874, 174730, "PagoMovil"),
    (147.94, 874, 129286, "PagoMovil"),
    (99.94, 874, 87339, "PagoMovil"),
    (100.01, 874, 87400, "BANK"),
    (99.94, 874, 87339, "PagoMovil"),
    (99.94, 874, 87339, "PagoMovil"),
    (152.94, 874, 133656, "PagoMovil"),
    (184.22, 874, 161000, "PagoMovil"),
    (113.13, 875, 99000, "PagoMovil"),
    (397.94, 874, 347923, "PagoMovil"),
    (101.22, 874, 88500, "PagoMovil"),
    (164.94, 874, 144209, "PagoMovil"),
    (74.96, 874, 65482, "PagoMovil"),
    (85.85, 874, 75000, "PagoMovil"),
    (68.68, 874, 60000, "Mercantil"),
    (72.11, 874, 63000, "PagoMovil"),
    (178.94, 871, 155857, "PagoMovil"),
    (99.94, 871, 87048, "PagoMovil"),
    (79.84, 871, 69541, "PagoMovil"),
    (85.69, 872, 74722, "PagoMovil"),
    (59.94, 879, 52712, "PagoMovil"),
    (87.85, 879, 77259, "PagoMovil"),
    (93.94, 879, 82612, "PagoMovil"),
    (77.33, 878, 67873, "PagoMovil"),
    (119.76, 878, 105115, "PagoMovil"),
    (99.80, 878, 87595, "PagoMovil"),
    (61.54, 878, 54014, "PagoMovil"),
    (72.94, 878, 64020, "PagoMovil"),
    (79.94, 879, 70236, "PagoMovil"),
    (85.83, 879, 75411, "PagoMovil"),
    (121.76, 879, 106980, "PagoMovil"),
    (71.94, 879, 63207, "PagoMovil"),
    (57.94, 878, 50855, "PagoMovil"),
    (56.94, 878, 50000, "PagoMovil"),
    (59.87, 879, 52600, "BNC"),
    (56.91, 879, 50000, "PagoMovil"),
    (56.91, 879, 50000, "PagoMovil"),
    (25.04, 878, 22000, "PagoMovil"),
    (25.04, 878, 22000, "PagoMovil"),
    (30.73, 878, 27000, "PagoMovil"),
]


def is_pm(b):
    return "Pago" in b


u = sum(x[0] for x in buys)
bs = sum(x[2] for x in buys)
avg = bs / u
pm_bs = sum(x[2] for x in buys if is_pm(x[3]))
fee = pm_bs * PM
left = CAPITAL - bs
ad = u * 0.2 / 1000
# costo efectivo por USDT incluyendo PM
eff = (bs + fee) / u

print(f"ops={len(buys)}")
print(f"USDT={u:.2f}")
print(f"Bs_gastados={bs:,.0f}")
print(f"media={avg:.2f}")
print(f"PM_fee={fee:,.0f}")
print(f"capital={CAPITAL:,.0f}")
print(f"sobrante_bs={left:,.0f}")
print(f"costo_efectivo={eff:.2f} Bs/USDT (con PM)")
print(f"anuncio~={ad:.2f} USDT")
print(f"USDT_neto_aprox={u - ad:.2f}")
# si vendieron el capital a tasa X, ganancia = (tasa_venta - costo) * usdt
# sin ventas: solo reportar sobrante + inventario
print(f"valor_inventario_a_media={u * avg:,.0f}")
