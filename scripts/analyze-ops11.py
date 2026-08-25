#!/usr/bin/env python3
PM = 0.003

# Ventas 15 ago COMPLETED (analyze-ops10)
sells = [
    (59.48, 889, 52880, "PagoMovil"),
    (59.61, 889, 53000, "PagoMovil"),
    (120.24, 889, 106893, "PagoMovil"),
    (168.72, 889, 150000, "PagoMovil"),
    (101.35, 888, 90000, "PagoMovil"),
    (208.33, 888, 185000, "PagoMovil"),
    (155.31, 888, 137915, "PagoMovil"),
    (109.39, 886, 96900, "PagoMovil"),
    (513.43, 886, 454800, "PagoMovil"),
    (120.79, 886, 107000, "PagoMovil"),
    (160.32, 886, 142011, "PagoMovil"),
    (63.54, 886, 56288, "PagoMovil"),
    (251.74, 886, 223000, "PagoMovil"),
    (111.76, 886, 99000, "PagoMovil"),
    (68.86, 886, 61000, "PagoMovil"),
    (136.59, 886, 121000, "PagoMovil"),
    (56.63, 883, 50000, "PagoMovil"),
    (83.24, 883, 73500, "PagoMovil"),
    (73.62, 883, 65000, "PagoMovil"),
    (113.26, 883, 100000, "PagoMovil"),
    (89.47, 883, 79000, "PagoMovil"),
    (56.63, 883, 50000, "PagoMovil"),
    (68.97, 883, 60900, "PagoMovil"),
    (158.56, 883, 140000, "PagoMovil"),
    (120.24, 883, 106160, "PagoMovil"),
    (80.16, 883, 70773, "PagoMovil"),
    (113.26, 883, 100000, "PagoMovil"),
    (167.70, 883, 148070, "PagoMovil"),
    (101.93, 883, 90000, "PagoMovil"),
    (56.63, 883, 50000, "PagoMovil"),
    (100.80, 883, 89000, "PagoMovil"),
    (113.26, 883, 100000, "PagoMovil"),
    (120.05, 883, 106000, "PagoMovil"),
    (74.75, 883, 66000, "PagoMovil"),
    (125.25, 883, 110583, "PagoMovil"),
    (65.70, 883, 58000, "PagoMovil"),
    (56.64, 883, 50000, "PagoMovil"),
    (60.26, 883, 53200, "PagoMovil"),
    (100.20, 883, 88447, "Banesco"),
    (62.92, 883, 55540, "Banesco"),
    (203.91, 883, 180000, "PagoMovil"),
    (62.13, 883, 54850, "Tesoro"),
    (198.25, 883, 175000, "PagoMovil"),
    (56.64, 883, 50000, "PagoMovil"),
    (109.98, 882, 97000, "PagoMovil"),
    (68.13, 882, 60084, "PagoMovil"),
    (200.40, 883, 176933, "PagoMovil"),
    (80.16, 883, 70773, "PagoMovil"),
    (113.26, 883, 100000, "PagoMovil"),
    (74.98, 883, 66200, "PagoMovil"),
    (66.82, 883, 59000, "PagoMovil"),
    (79.28, 883, 70000, "PagoMovil"),
    (79.28, 883, 70000, "PagoMovil"),
    (113.26, 883, 100000, "PagoMovil"),
    (79.28, 883, 70000, "PagoMovil"),
    (104.20, 883, 92000, "PagoMovil"),
    (80.16, 883, 70773, "PagoMovil"),
    (62.36, 882, 55000, "PagoMovil"),
    (57.82, 882, 51000, "PagoMovil"),
    (108.85, 882, 96000, "PagoMovil"),
    (59.53, 882, 52500, "PagoMovil"),
    (153.07, 882, 135000, "PagoMovil"),
    (198.43, 882, 175000, "PagoMovil"),
    (102.05, 882, 90000, "BDDT"),
    (70.30, 882, 62000, "PagoMovil"),
    (68.03, 882, 60000, "PagoMovil"),
    (61.23, 882, 54000, "PagoMovil"),
    (64.63, 882, 57000, "PagoMovil"),
    (79.37, 882, 70000, "PagoMovil"),
    (73.70, 882, 65000, "PagoMovil"),
    (112.25, 882, 99000, "PagoMovil"),
    (70.14, 882, 61856, "PagoMovil"),
    (77.55, 882, 68391, "PagoMovil"),
    (160.32, 882, 141386, "Mercantil"),
    (80.50, 882, 71000, "PagoMovil"),
    (125.25, 882, 110458, "PagoMovil"),
    (70.30, 882, 62000, "PagoMovil"),
    (170.08, 882, 150000, "PagoMovil"),
    (56.69, 882, 50000, "PagoMovil"),
    (86.17, 882, 76000, "BNC"),
    (124.73, 882, 110000, "Mercantil"),
    (90.81, 881, 80000, "PagoMovil"),
    (68.11, 881, 60000, "PagoMovil"),
    (99.89, 881, 88000, "PagoMovil"),
    (102.16, 881, 90000, "PagoMovil"),
    (56.76, 881, 50000, "PagoMovil"),
    (113.52, 881, 100000, "PagoMovil"),
    (169.71, 881, 149500, "PagoMovil"),
    (85.17, 881, 75026, "PagoMovil"),
    (56.81, 880, 50000, "PagoMovil"),
    (100.56, 880, 88500, "PagoMovil"),
]

# Compras COMPLETED (excluye BUYER_PAYED 98.42)
# última fila sin estado → COMPLETED
buys = [
    (99.76, 862, 86000, "BNC"),
    (499.00, 863, 430672, "PagoMovil"),
    (99.94, 864, 86304, "PagoMovil"),
    (105.08, 864, 90750, "PagoMovil"),
    (99.94, 864, 86304, "PagoMovil"),
    (99.94, 864, 86304, "PagoMovil"),
    (110.24, 864, 95200, "PagoMovil"),
    (499.00, 863, 430388, "PagoMovil"),
    (259.48, 861, 223464, "PagoMovil"),
    (99.94, 862, 86114, "PagoMovil"),
    (92.86, 862, 80000, "PagoMovil"),
    (1158.86, 863, 1000000, "BDDT"),
    (99.94, 863, 86248, "PagoMovil"),
    (92.69, 863, 80000, "PagoMovil"),
    (97.33, 863, 84000, "PagoMovil"),
    (99.94, 864, 86363, "PagoMovil"),
    (99.94, 864, 86363, "PagoMovil"),
    (99.94, 864, 86363, "PagoMovil"),
    (100.94, 864, 87218, "PagoMovil"),
    (108.94, 864, 94131, "PagoMovil"),
    (114.77, 864, 99168, "PagoMovil"),
    (108.94, 864, 94131, "PagoMovil"),
    (119.00, 864, 102823, "PagoMovil"),
    (115.73, 864, 100000, "PagoMovil"),
    (92.58, 864, 80000, "PagoMovil"),
    (99.94, 864, 86354, "PagoMovil"),
    (243.03, 864, 210000, "PagoMovil"),
    (99.94, 863, 86248, "PagoMovil"),
    (98.57, 863, 85066, "PagoMovil"),
    (104.28, 863, 90000, "PagoMovil"),
    (144.74, 864, 125000, "PagoMovil"),
    (100.74, 864, 87000, "PagoMovil"),
    (69.94, 862, 60267, "PagoMovil"),
    (64.98, 862, 56000, "PagoMovil"),
    (58.02, 862, 50000, "PagoMovil"),
    (69.86, 862, 60198, "PagoMovil"),
    (67.67, 862, 58300, "PagoMovil"),
    (69.64, 862, 60000, "PagoMovil"),
    (58.03, 862, 50000, "PagoMovil"),
    (59.94, 862, 51638, "PagoMovil"),
    (58.94, 862, 50777, "PagoMovil"),
    (58.03, 862, 50000, "PagoMovil"),
    (77.10, 863, 66555, "PagoMovil"),
    (61.41, 863, 53000, "PagoMovil"),
    (58.91, 863, 50839, "PagoMovil"),
    (74.94, 864, 64759, "PagoMovil"),
    (79.94, 864, 69080, "PagoMovil"),
    (78.69, 864, 68000, "PagoMovil"),
    (99.80, 864, 86242, "PagoMovil"),
    (74.85, 864, 64682, "PagoMovil"),
    (67.11, 864, 58000, "PagoMovil"),
    (63.94, 864, 55254, "PagoMovil"),
    (73.19, 864, 63254, "PagoMovil"),
    (69.94, 864, 60439, "PagoMovil"),
    (99.51, 864, 86000, "PagoMovil"),
    (64.80, 864, 56000, "PagoMovil"),
    (98.36, 864, 85000, "PagoMovil"),
    (69.43, 864, 60000, "PagoMovil"),
    (99.51, 864, 86000, "PagoMovil"),
    (23.13, 865, 20011, "PagoMovil"),
]

pending = [(98.42, 864, 85000, "PagoMovil")]


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

m = min(bu, su)
sp = savg - bavg
gross = m * sp
feem = feeb * (m / bu) + fees * (m / su)
net = gross - feem
ad = bu * 0.2 / 1000

print("=== VENTAS COMPLETED (15 ago) ===")
print(f"ops={len(sells)} U={su:.2f} Bs={sbs:,.0f} media={savg:.2f} feePM={fees:,.0f}")
print()
print("=== COMPRAS COMPLETED (16 ago) ===")
print(f"ops={len(buys)} U={bu:.2f} Bs={bbs:,.0f} media={bavg:.2f} feePM={feeb:,.0f}")
print()
print(f"BUYER_PAYED pendiente: U={pu:.2f} Bs={pbs:,.0f}")
print()
print("=== NETO (solo COMPLETED) ===")
print(f"inv={bu-su:+.2f} caja={sbs-bbs:+,.0f}")
print(f"matched={m:.2f} spread={sp:.2f}")
print(f"bruta={gross:,.0f} (~{gross/bavg:.1f} U)")
print(f"fee={feem:,.0f} neta={net:,.0f} (~{net/bavg:.1f} U)")
print(f"ad={ad:.2f} neta_tras_ad={net/bavg-ad:.1f} U (~{(net/bavg-ad)*bavg:,.0f} Bs)")
print()
bu2, bbs2 = bu + pu, bbs + pbs
m2 = min(bu2, su)
sp2 = savg - bbs2 / bu2
gross2 = m2 * sp2
feeb2 = (sum(r[2] for r in buys + pending if is_pm(r[3])) * PM) * (m2 / bu2)
fees2 = fees * (m2 / su)
net2 = gross2 - feeb2 - fees2
ad2 = bu2 * 0.2 / 1000
print("=== SI CIERRA BUYER_PAYED ===")
print(f"compras U={bu2:.2f} Bs={bbs2:,.0f} media={bbs2/bu2:.2f}")
print(f"inv={bu2-su:+.2f} caja={sbs-bbs2:+,.0f}")
print(f"spread={sp2:.2f} neta={net2:,.0f} (~{net2/(bbs2/bu2):.1f} U) tras_ad={net2/(bbs2/bu2)-ad2:.1f}")
