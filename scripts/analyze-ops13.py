#!/usr/bin/env python3
"""Cierre ciclo 15-18 ago: ops12 + ventas 17 PM + compras 18 AM."""
import ast
from pathlib import Path

src = Path(r"c:\Users\salva\Downloads\Telegram Desktop\p2p\p2p\scripts\analyze-ops12.py").read_text(encoding="utf-8")
# ops12 builds sells/buys via exec of ops11 + extras. Run that construction only.
# Simpler: import ops12 lists by exec until after pending assignment.

PM = 0.003

# Load ops11 lists
src11 = Path(r"c:\Users\salva\Downloads\Telegram Desktop\p2p\p2p\scripts\analyze-ops11.py").read_text(encoding="utf-8")
mod = ast.parse(src11)
ns = {}
for node in mod.body:
    if isinstance(node, ast.Assign):
        names = [t.id for t in node.targets if isinstance(t, ast.Name)]
        if names and names[0] in ("sells", "buys"):
            exec(compile(ast.Module([node], []), "<ops11>", "exec"), ns)

sells = list(ns["sells"])
buys = list(ns["buys"])

# ops12 extras (BDV 16 + BDV 17 09:58 already counted — do NOT add 462.40 again)
sells += [
    (1148.61, 871, 1_000_000, "BDV"),
    (462.40, 865, 400_000, "BDV"),
]
buys += [
    (60.49, 860, 52000, "PagoMovil"),
    (60.02, 860, 51593, "PagoMovil"),
    (93.94, 860, 80751, "PagoMovil"),
    (197.76, 860, 170000, "PagoMovil"),
    (124.47, 860, 107000, "PagoMovil"),
    (58.16, 860, 50000, "PagoMovil"),
    (79.84, 860, 68630, "PagoMovil"),
    (98.94, 860, 85049, "PagoMovil"),
    (93.40, 857, 80000, "PagoMovil"),
    (77.87, 857, 66700, "PagoMovil"),
    (399.20, 856, 341516, "PagoMovil"),
    (99.94, 857, 85599, "PagoMovil"),
    (99.94, 857, 85599, "PagoMovil"),
    (99.94, 857, 85599, "PagoMovil"),
    (116.75, 857, 100000, "PagoMovil"),
    (100.94, 859, 86693, "PagoMovil"),
    (271.28, 859, 233000, "Tesoro"),
    (139.72, 859, 120000, "PagoMovil"),
    (199.60, 859, 171428, "PagoMovil"),
    (199.60, 859, 171428, "Provincial"),
    (278.17, 861, 239421, "PagoMovil"),
    (119.94, 861, 103232, "PagoMovil"),
    (98.42, 864, 85000, "PagoMovil"),
]

# Tesoro BUYER_PAYED 142.04 not in this paste — still pending, exclude

# Ventas 17 PM COMPLETED (sin 462.40 duplicada)
new_sells = [
    (55.56, 900, 50000, "PagoMovil"),
    (99.56, 900, 89600, "PagoMovil"),
    (60.00, 900, 54000, "PagoMovil"),
    (55.56, 900, 50000, "PagoMovil"),
    (111.12, 900, 100000, "PagoMovil"),
    (66.67, 900, 60000, "PagoMovil"),
    (98.89, 900, 89000, "PagoMovil"),
    (100.06, 899, 89944, "PagoMovil"),
    (61.18, 899, 55000, "PagoMovil"),
    (75.64, 899, 68000, "PagoMovil"),
    (95.67, 899, 86000, "PagoMovil"),
    (55.73, 899, 50100, "PagoMovil"),
    (60.07, 899, 54000, "PagoMovil"),
    (111.24, 899, 100000, "PagoMovil"),
    (200.40, 899, 180140, "PagoMovil"),
    (100.12, 899, 90000, "Provincial"),
    (200.24, 899, 180000, "PagoMovil"),
    (72.31, 899, 65000, "PagoMovil"),
    (111.49, 897, 100000, "PagoMovil"),
    (445.98, 897, 400000, "PagoMovil"),
    (80.06, 897, 71806, "Provincial"),
    (69.36, 894, 62000, "PagoMovil"),
    (85.03, 894, 76000, "PagoMovil"),
    (99.57, 894, 89000, "PagoMovil"),
    (78.31, 894, 70000, "PagoMovil"),
    (67.12, 894, 60000, "PagoMovil"),
    (55.94, 894, 50000, "PagoMovil"),
    (80.16, 894, 71647, "PagoMovil"),
    (1125.90, 888, 1000000, "BDV"),
    (89.39, 895, 80000, "PagoMovil"),
    (124.31, 893, 111000, "PagoMovil"),
    (98.22, 896, 88000, "PagoMovil"),
]

# Compras 18 AM COMPLETED
new_buys = [
    (7.97, 878, 7000, "PagoMovil"),
    (5.69, 878, 5000, "PagoMovil"),
    (62.17, 885, 55000, "PagoMovil"),
    (73.48, 885, 65000, "PagoMovil"),
    (67.94, 885, 60097, "PagoMovil"),
    (69.19, 885, 61203, "PagoMovil"),
    (64.94, 885, 57443, "PagoMovil"),
    (70.09, 885, 62000, "PagoMovil"),
    (84.94, 885, 75140, "PagoMovil"),
    (92.70, 885, 82000, "PagoMovil"),
    (59.94, 885, 53021, "PagoMovil"),
    (69.86, 885, 61795, "PagoMovil"),
    (69.94, 885, 61866, "PagoMovil"),
    (94.94, 885, 83980, "PagoMovil"),
    (94.94, 886, 84117, "PagoMovil"),
    (137.72, 886, 122020, "PagoMovil"),
    (79.00, 886, 70000, "PagoMovil"),
    (103.14, 886, 91382, "PagoMovil"),
    (99.80, 886, 88423, "PagoMovil"),
    (79.94, 886, 70827, "PagoMovil"),
    (180.58, 886, 160000, "BNC"),
    (108.79, 886, 96388, "PagoMovil"),
    (185.67, 886, 164504, "BNC"),
    (64.54, 885, 57135, "PagoMovil"),
    (112.96, 885, 100000, "BNC"),
    (59.94, 885, 53062, "PagoMovil"),
    (74.50, 884, 65866, "PagoMovil"),
    (149.94, 884, 132563, "PagoMovil"),
    (79.94, 884, 70676, "Provincial"),
    (61.07, 884, 54000, "PagoMovil"),
    (99.80, 884, 88234, "PagoMovil"),
    (56.55, 884, 50000, "PagoMovil"),
    (56.55, 884, 50000, "PagoMovil"),
    (70.94, 884, 62719, "PagoMovil"),
    (67.86, 884, 60000, "PagoMovil"),
    (80.94, 884, 71560, "PagoMovil"),
    (184.36, 884, 163000, "PagoMovil"),
    (69.86, 884, 61764, "PagoMovil"),
    (89.94, 884, 79517, "PagoMovil"),
    (99.94, 884, 88358, "PagoMovil"),
    (499.94, 884, 441862, "PagoMovil"),
    (72.42, 884, 64000, "PagoMovil"),
    (59.94, 884, 52969, "PagoMovil"),
    (61.68, 883, 54489, "PagoMovil"),
    (68.01, 882, 60000, "PagoMovil"),
    (146.24, 882, 129000, "PagoMovil"),
    (56.74, 881, 50000, "PagoMovil"),
    (56.74, 881, 50000, "PagoMovil"),
    (77.75, 881, 68500, "PagoMovil"),
    (59.94, 881, 52807, "PagoMovil"),
    (57.94, 881, 51045, "PagoMovil"),
    (63.56, 881, 56000, "PagoMovil"),
    (99.94, 881, 88047, "PagoMovil"),
    (59.94, 881, 52807, "PagoMovil"),
    (56.84, 880, 50000, "PagoMovil"),
    (59.94, 880, 52721, "PagoMovil"),
]


def is_pm(b):
    return "Pago" in b


def tot(rows):
    u = sum(r[0] for r in rows)
    bs = sum(r[2] for r in rows)
    pm = sum(r[2] for r in rows if is_pm(r[3]))
    return u, bs, bs / u, pm * PM


def report(title, S, B):
    bu, bbs, bavg, feeb = tot(B)
    su, sbs, savg, fees = tot(S)
    m = min(bu, su)
    sp = savg - bavg
    gross = m * sp
    feem = feeb * (m / bu) + fees * (m / su)
    net = gross - feem
    ad = bu * 0.2 / 1000
    print(f"=== {title} ===")
    print(f"ventas ops={len(S)} U={su:.2f} Bs={sbs:,.0f} media={savg:.2f} feePM={fees:,.0f}")
    print(f"compras ops={len(B)} U={bu:.2f} Bs={bbs:,.0f} media={bavg:.2f} feePM={feeb:,.0f}")
    print(f"inv={bu - su:+.2f} caja={sbs - bbs:+,.0f}")
    print(f"matched={m:.2f} spread={sp:.2f}")
    print(f"bruta={gross:,.0f} (~{gross / bavg:.1f} U)")
    print(f"fee={feem:,.0f} neta={net:,.0f} (~{net / bavg:.1f} U)")
    print(f"ad={ad:.2f} neta_tras_ad={net / bavg - ad:.1f} U (~{(net / bavg - ad) * bavg:,.0f} Bs)")
    print()


report("TRAMO NUEVO 17 PM ventas + 18 AM compras (sin 462.40)", new_sells, new_buys)
report("CICLO COMPLETO 15-18 (cierre)", sells + new_sells, buys + new_buys)
