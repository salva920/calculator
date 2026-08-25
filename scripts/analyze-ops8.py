#!/usr/bin/env python3
"""Ciclo ventas 13 ago noche + 14 ago AM, compras 14 ago."""

PM = 0.003

# COMPLETED only — exclude BUYER_PAYED
buys = [
    (44.48, 867, 38553, "PagoMovil"),
    (50.76, 867, 44000, "PagoMovil"),
    (35.76, 867, 31000, "PagoMovil"),
    (35.10, 867, 30420, "PagoMovil"),
    (35.96, 867, 31173, "PagoMovil"),
    (42.44, 867, 36775, "PagoMovil"),
    (99.80, 867, 86478, "PagoMovil"),
    (34.62, 867, 30000, "PagoMovil"),
    (51.94, 867, 45007, "PagoMovil"),
    (34.62, 867, 30000, "PagoMovil"),
    (34.62, 867, 30000, "PagoMovil"),
    (40.39, 867, 35000, "PagoMovil"),
    (44.94, 867, 38941, "PagoMovil"),
    (49.94, 867, 43274, "PagoMovil"),
    (100.80, 867, 87344, "PagoMovil"),
    (52.94, 867, 45873, "PagoMovil"),
    (50.22, 867, 43524, "PagoMovil"),
    (35.77, 867, 31000, "PagoMovil"),
    (79.94, 867, 69332, "PagoMovil"),
    (78.19, 866, 67729, "PagoMovil"),
    (83.12, 866, 72000, "PagoMovil"),
    (79.94, 869, 69468, "PagoMovil"),
    (213.29, 869, 185350, "PagoMovil"),
    (59.94, 869, 52088, "PagoMovil"),
    (57.53, 869, 50000, "PagoMovil"),
    (63.29, 869, 55000, "PagoMovil"),
    (89.82, 869, 78054, "PagoMovil"),
    (59.94, 869, 52088, "PagoMovil"),
    (69.94, 869, 60778, "PagoMovil"),
    (99.94, 869, 86848, "PagoMovil"),
    (109.78, 869, 95399, "PagoMovil"),
    (99.80, 869, 86726, "PagoMovil"),
    (79.84, 869, 69381, "PagoMovil"),
    (88.73, 869, 77107, "PagoMovil"),
    (99.80, 869, 86726, "PagoMovil"),
    (99.94, 869, 86848, "PagoMovil"),
    (89.82, 869, 78054, "PagoMovil"),
    (99.80, 869, 86726, "PagoMovil"),
    (99.80, 868, 86632, "PagoMovil"),
    (90.82, 869, 78888, "PagoMovil"),
    (99.80, 869, 86688, "PagoMovil"),
    (499.00, 869, 433431, "PagoMovil"),
    (69.94, 870, 60813, "PagoMovil"),
    (99.94, 870, 86898, "PagoMovil"),
    (69.00, 870, 60000, "Provincial"),
    (88.67, 870, 77100, "PagoMovil"),
    (59.82, 870, 52013, "PagoMovil"),
    (59.94, 870, 52118, "PagoMovil"),
    (89.94, 870, 78203, "PagoMovil"),
    (57.50, 870, 50000, "PagoMovil"),
    (99.94, 870, 86900, "PagoMovil"),
    (59.94, 870, 52118, "PagoMovil"),
    (199.94, 870, 173848, "PagoMovil"),
    (62.26, 870, 54138, "PagoMovil"),
    (89.70, 870, 78000, "PagoMovil"),
    (89.99, 870, 78250, "Provincial"),
    (239.94, 870, 208628, "PagoMovil"),
    (92.00, 870, 80000, "PagoMovil"),
    (61.64, 870, 53596, "PagoMovil"),
    (99.80, 869, 86747, "PagoMovil"),
    (69.94, 870, 60852, "PagoMovil"),
    (59.94, 870, 52151, "PagoMovil"),
    (65.87, 870, 57315, "PagoMovil"),
    (69.86, 870, 60782, "PagoMovil"),
    (69.94, 870, 60852, "PagoMovil"),
    (70.11, 870, 61000, "Provincial"),
    (57.46, 870, 50000, "PagoMovil"),
    (78.35, 870, 68178, "PagoMovil"),
    (59.94, 870, 52151, "PagoMovil"),
    (89.94, 870, 78253, "PagoMovil"),
    (79.94, 870, 69553, "PagoMovil"),
    (99.94, 873, 87199, "PagoMovil"),
    (99.80, 873, 87125, "PagoMovil"),
]

# BUYER_PAYED pending (not in totals above)
pending = [
    (49.94, 867, 43281, "PagoMovil"),
    (59.94, 867, 51948, "PagoMovil"),
    (109.94, 869, 95538, "PagoMovil"),
]

# COMPLETED sells only
sells = [
    (78.24, 895, 70000, "PagoMovil"),
    (1000.11, 891, 891000, "BNC"),
    (89.79, 891, 80000, "PagoMovil"),
    (106.51, 892, 95000, "PagoMovil"),
    (168.36, 891, 150000, "PagoMovil"),
    (56.12, 891, 50000, "PagoMovil"),
    (224.49, 891, 200000, "Provincial"),
    (56.06, 892, 50000, "Provincial"),
    (73.75, 895, 66000, "PagoMovil"),
    (110.22, 895, 98636, "Provincial"),
    (55.87, 895, 50000, "PagoMovil"),
    (80.16, 897, 71896, "Provincial"),
    (789.47, 897, 708000, "Tesoro"),
    (207.84, 895, 186000, "PagoMovil"),
    (2239.13, 893, 2000000, "BDV"),
    (99.45, 894, 88889, "PagoMovil"),
    (100.69, 894, 90000, "PagoMovil"),
    (346.83, 894, 310000, "BDDT"),
    (89.69, 892, 80000, "PagoMovil"),
    (133.42, 892, 119000, "PagoMovil"),
    (100.20, 893, 89469, "PagoMovil"),
]


def is_pm(b):
    return "Pago" in b


def tot(rows):
    u = sum(r[0] for r in rows)
    bs = sum(r[2] for r in rows)
    pm = sum(r[2] for r in rows if is_pm(r[3]))
    return u, bs, bs / u, pm * PM


bu, bbs, bavg, feeb = tot(buys)
su, sbs, savg, fees = tot(sells)
pu, pbs, _, _ = tot(pending)

matched = min(bu, su)
spread = savg - bavg
gross = matched * spread
feeb_m = feeb * (matched / bu)
fees_m = fees * (matched / su)
fee_m = feeb_m + fees_m
net = gross - fee_m
ad = bu * 0.2 / 1000

print("=== VENTAS COMPLETED ===")
print(f"ops={len(sells)} USDT={su:.2f} Bs={sbs:,.0f} media={savg:.2f}")
print(f"fee PM ventas={fees:,.0f}")
print()
print("=== COMPRAS COMPLETED ===")
print(f"ops={len(buys)} USDT={bu:.2f} Bs={bbs:,.0f} media={bavg:.2f}")
print(f"fee PM compras={feeb:,.0f}")
print()
print("=== BUYER_PAYED (pendientes, NO incluidas) ===")
print(f"ops={len(pending)} USDT={pu:.2f} Bs={pbs:,.0f}")
print()
print("=== NETO CICLO (solo COMPLETED) ===")
print(f"Inventario USDT: {bu - su:+.2f}")
print(f"Diff caja Bs (ventas-compras): {sbs - bbs:+,.0f}")
print(f"Matched={matched:.2f} spread={spread:.2f}")
print(f"Bruta={gross:,.0f} Bs (~{gross/bavg:.1f} USDT)")
print(f"Fee PM matched={fee_m:,.0f} Bs")
print(f"Neta={net:,.0f} Bs (~{net/bavg:.1f} USDT @compra / {net/savg:.1f} @venta)")
print(f"Anuncio~{ad:.2f} USDT")
print(f"Neta tras anuncio~{net/bavg - ad:.1f} USDT (~{(net/bavg - ad)*bavg:,.0f} Bs)")
print()
# si se cierran pendientes
bu2, bbs2 = bu + pu, bbs + pbs
print("=== SI CIERRAN LAS 3 BUYER_PAYED ===")
print(f"Compras USDT={bu2:.2f} Bs={bbs2:,.0f} media={bbs2/bu2:.2f}")
print(f"Inventario vs ventas: {bu2 - su:+.2f}")
print(f"Diff caja: {sbs - bbs2:+,.0f}")
matched2 = min(bu2, su)
spread2 = savg - (bbs2 / bu2)
gross2 = matched2 * spread2
feeb2 = (sum(r[2] for r in buys + pending if is_pm(r[3])) * PM) * (matched2 / bu2)
fees2 = fees * (matched2 / su)
net2 = gross2 - feeb2 - fees2
ad2 = bu2 * 0.2 / 1000
print(f"Spread={spread2:.2f} Neta~{net2:,.0f} Bs (~{net2/(bbs2/bu2):.1f} USDT) tras anuncio~{net2/(bbs2/bu2)-ad2:.1f}")
