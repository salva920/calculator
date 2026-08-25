#!/usr/bin/env python3
"""Ciclo 15-17 ago: ventas previas + BDV 16 y 17, compras 16-17."""
import importlib.util

spec = importlib.util.spec_from_file_location(
    "ops11",
    r"c:\Users\salva\Downloads\Telegram Desktop\p2p\p2p\scripts\analyze-ops11.py",
)
# Don't exec ops11 (it prints). Copy lists by reading as data.
# Instead define extras and load lists via ast from ops11.

import ast
from pathlib import Path

src = Path(r"c:\Users\salva\Downloads\Telegram Desktop\p2p\p2p\scripts\analyze-ops11.py").read_text(encoding="utf-8")
mod = ast.parse(src)
ns = {}
for node in mod.body:
    if isinstance(node, ast.Assign):
        names = [t.id for t in node.targets if isinstance(t, ast.Name)]
        if names and names[0] in ("sells", "buys", "pending", "PM"):
            exec(compile(ast.Module([node], []), "<ops11>", "exec"), ns)

PM = 0.003
sells = list(ns["sells"])
buys = list(ns["buys"])

# venta BDV 16 ago + venta BDV 17 ago
sells += [
    (1148.61, 871, 1_000_000, "BDV"),
    (462.40, 865, 400_000, "BDV"),
]

# compras nuevas COMPLETED (17 ago) + BUYER_PAYED 98.42 ahora COMPLETED
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

pending = [(142.04, 859, 122000, "Tesoro")]


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

print("=== VENTAS COMPLETED ===")
print(f"ops={len(sells)} U={su:.2f} Bs={sbs:,.0f} media={savg:.2f} feePM={fees:,.0f}")
print()
print("=== COMPRAS COMPLETED ===")
print(f"ops={len(buys)} U={bu:.2f} Bs={bbs:,.0f} media={bavg:.2f} feePM={feeb:,.0f}")
print()
print(f"BUYER_PAYED Tesoro: U={pu:.2f} Bs={pbs:,.0f}")
print()
print("=== NETO (solo COMPLETED) ===")
print(f"inv={bu - su:+.2f} caja={sbs - bbs:+,.0f}")
print(f"matched={m:.2f} spread={sp:.2f}")
print(f"bruta={gross:,.0f} (~{gross / bavg:.1f} U)")
print(f"fee={feem:,.0f} neta={net:,.0f} (~{net / bavg:.1f} U)")
print(f"ad={ad:.2f} neta_tras_ad={net / bavg - ad:.1f} U (~{(net / bavg - ad) * bavg:,.0f} Bs)")
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
print(f"compras U={bu2:.2f} Bs={bbs2:,.0f} media={bbs2 / bu2:.2f}")
print(f"inv={bu2 - su:+.2f} caja={sbs - bbs2:+,.0f}")
print(f"spread={sp2:.2f} neta={net2:,.0f} (~{net2 / (bbs2 / bu2):.1f} U) tras_ad={net2 / (bbs2 / bu2) - ad2:.1f}")
