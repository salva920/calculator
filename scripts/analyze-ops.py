# -*- coding: utf-8 -*-
"""Analiza ventas/compras COMPLETED del listado pegado por el usuario."""
import re
from collections import defaultdict

RAW = r"""
20/07/26, 10:55 a. m.	Compra	61.42 USDT	Bs.S 847	Bs.S 52.000	PagoMovil	COMPLETED
20/07/26, 10:52 a. m.	Compra	59.06 USDT	Bs.S 847	Bs.S 50.000	PagoMovil	COMPLETED
20/07/26, 10:49 a. m.	Compra	349.30 USDT	Bs.S 846	Bs.S 295.508	PagoMovil	COMPLETED
20/07/26, 10:49 a. m.	Compra	79.94 USDT	Bs.S 846	Bs.S 67.629	PagoMovil	COMPLETED
20/07/26, 10:47 a. m.	Compra	264.47 USDT	Bs.S 846	Bs.S 223.742	PagoMovil	COMPLETED
20/07/26, 10:47 a. m.	Compra	139.72 USDT	Bs.S 846	Bs.S 118.203	PagoMovil	COMPLETED
20/07/26, 10:34 a. m.	Compra	144.71 USDT	Bs.S 838	Bs.S 121.271	PagoMovil	COMPLETED
20/07/26, 10:34 a. m.	Compra	64.94 USDT	Bs.S 838	Bs.S 54.422	PagoMovil	COMPLETED
20/07/26, 10:34 a. m.	Compra	69.94 USDT	Bs.S 838	Bs.S 58.612	PagoMovil	COMPLETED
20/07/26, 10:33 a. m.	Compra	239.94 USDT	Bs.S 838	Bs.S 201.077	PagoMovil	COMPLETED
20/07/26, 10:33 a. m.	Compra	149.94 USDT	Bs.S 838	Bs.S 125.654	PagoMovil	COMPLETED
20/07/26, 10:33 a. m.	Compra	74.79 USDT	Bs.S 838	Bs.S 62.676	PagoMovil	COMPLETED
20/07/26, 10:31 a. m.	Compra	59.66 USDT	Bs.S 838	Bs.S 50.000	PagoMovil	COMPLETED
20/07/26, 10:31 a. m.	Compra	299.40 USDT	Bs.S 838	Bs.S 250.906	PagoMovil	COMPLETED
20/07/26, 10:05 a. m.	Compra	899.94 USDT	Bs.S 854	Bs.S 768.550	Bancamiga	COMPLETED
20/07/26, 10:04 a. m.	Compra	99.94 USDT	Bs.S 854	Bs.S 85.349	PagoMovil	COMPLETED
20/07/26, 10:04 a. m.	Compra	90.74 USDT	Bs.S 854	Bs.S 77.500	PagoMovil	COMPLETED
20/07/26, 10:04 a. m.	Compra	79.94 USDT	Bs.S 854	Bs.S 68.269	PagoMovil	COMPLETED
20/07/26, 10:04 a. m.	Compra	58.54 USDT	Bs.S 854	Bs.S 50.000	Bancamiga	COMPLETED
20/07/26, 10:04 a. m.	Compra	109.94 USDT	Bs.S 854	Bs.S 93.889	PagoMovil	COMPLETED
20/07/26, 10:02 a. m.	Compra	99.53 USDT	Bs.S 854	Bs.S 85.000	PagoMovil	COMPLETED
20/07/26, 10:02 a. m.	Compra	58.54 USDT	Bs.S 854	Bs.S 50.000	PagoMovil	COMPLETED
20/07/26, 10:02 a. m.	Compra	99.94 USDT	Bs.S 854	Bs.S 85.349	PagoMovil	COMPLETED
20/07/26, 10:02 a. m.	Compra	398.12 USDT	Bs.S 854	Bs.S 340.000	Provincial	COMPLETED
20/07/26, 09:52 a. m.	Compra	87.97 USDT	Bs.S 853	Bs.S 75.000	PagoMovil	COMPLETED
20/07/26, 09:51 a. m.	Compra	98.53 USDT	Bs.S 853	Bs.S 84.000	PagoMovil	COMPLETED
20/07/26, 09:50 a. m.	Compra	59.94 USDT	Bs.S 853	Bs.S 51.099	PagoMovil	COMPLETED
20/07/26, 09:45 a. m.	Compra	60.55 USDT	Bs.S 850	Bs.S 51.500	PagoMovil	COMPLETED
20/07/26, 09:45 a. m.	Compra	149.92 USDT	Bs.S 850	Bs.S 127.500	PagoMovil	COMPLETED
20/07/26, 09:42 a. m.	Compra	58.85 USDT	Bs.S 850	Bs.S 50.000	Mercantil	COMPLETED
20/07/26, 09:39 a. m.	Compra	63.94 USDT	Bs.S 850	Bs.S 54.317	PagoMovil	COMPLETED
20/07/26, 09:38 a. m.	Compra	499.94 USDT	Bs.S 850	Bs.S 424.699	PagoMovil	COMPLETED
20/07/26, 09:37 a. m.	Compra	69.86 USDT	Bs.S 850	Bs.S 59.346	PagoMovil	COMPLETED
20/07/26, 09:37 a. m.	Compra	90.52 USDT	Bs.S 850	Bs.S 76.900	PagoMovil	COMPLETED
20/07/26, 09:36 a. m.	Compra	94.17 USDT	Bs.S 850	Bs.S 80.000	PagoMovil	COMPLETED
20/07/26, 09:35 a. m.	Compra	59.94 USDT	Bs.S 849	Bs.S 50.889	Mercantil	COMPLETED
20/07/26, 09:34 a. m.	Compra	199.60 USDT	Bs.S 849	Bs.S 169.461	Mercantil	COMPLETED
20/07/26, 09:26 a. m.	Compra	59.94 USDT	Bs.S 848	Bs.S 50.821	PagoMovil	COMPLETED
20/07/26, 09:26 a. m.	Compra	58.97 USDT	Bs.S 848	Bs.S 50.000	Bancamiga	COMPLETED
20/07/26, 09:18 a. m.	Compra	76.81 USDT	Bs.S 846	Bs.S 65.000	PagoMovil	COMPLETED
20/07/26, 09:16 a. m.	Compra	59.08 USDT	Bs.S 846	Bs.S 50.000	PagoMovil	COMPLETED
20/07/26, 09:13 a. m.	Compra	59.94 USDT	Bs.S 846	Bs.S 50.710	PagoMovil	COMPLETED
20/07/26, 09:03 a. m.	Compra	94.81 USDT	Bs.S 844	Bs.S 80.030	PagoMovil	COMPLETED
20/07/26, 09:02 a. m.	Compra	119.76 USDT	Bs.S 844	Bs.S 101.091	PagoMovil	COMPLETED
20/07/26, 09:02 a. m.	Compra	149.70 USDT	Bs.S 844	Bs.S 126.363	PagoMovil	COMPLETED
20/07/26, 09:01 a. m.	Compra	79.84 USDT	Bs.S 844	Bs.S 67.394	PagoMovil	COMPLETED
20/07/26, 09:01 a. m.	Compra	132.74 USDT	Bs.S 844	Bs.S 112.047	PagoMovil	COMPLETED
20/07/26, 09:01 a. m.	Compra	99.80 USDT	Bs.S 844	Bs.S 84.242	Provincial	COMPLETED
20/07/26, 08:48 a. m.	Compra	1181.32 USDT	Bs.S 847	Bs.S 1.000.000	BDDT	COMPLETED
20/07/26, 08:48 a. m.	Compra	199.94 USDT	Bs.S 847	Bs.S 169.251	PagoMovil	COMPLETED
20/07/26, 08:48 a. m.	Compra	96.27 USDT	Bs.S 847	Bs.S 81.500	PagoMovil	COMPLETED
20/07/26, 08:47 a. m.	Compra	71.94 USDT	Bs.S 847	Bs.S 60.898	PagoMovil	COMPLETED
20/07/26, 08:47 a. m.	Compra	82.69 USDT	Bs.S 847	Bs.S 70.000	BNCBancoNacional	COMPLETED
20/07/26, 07:56 a. m.	Compra	369.26 USDT	Bs.S 842	Bs.S 310.917	Provincial	COMPLETED
20/07/26, 07:34 a. m.	Compra	239.94 USDT	Bs.S 839	Bs.S 201.190	PagoMovil	COMPLETED
19/07/26, 08:39 p. m.	Compra	100.82 USDT	Bs.S 840	Bs.S 84.689	PagoMovil	COMPLETED
19/07/26, 08:39 p. m.	Compra	99.80 USDT	Bs.S 840	Bs.S 83.832	PagoMovil	COMPLETED
19/07/26, 08:38 p. m.	Compra	99.94 USDT	Bs.S 840	Bs.S 83.950	PagoMovil	COMPLETED
19/07/26, 08:38 p. m.	Compra	59.52 USDT	Bs.S 840	Bs.S 50.000	PagoMovil	COMPLETED
19/07/26, 08:37 p. m.	Compra	60.71 USDT	Bs.S 840	Bs.S 51.000	PagoMovil	COMPLETED
19/07/26, 08:36 p. m.	Compra	65.47 USDT	Bs.S 840	Bs.S 55.000	PagoMovil	COMPLETED
19/07/26, 08:36 p. m.	Compra	60.94 USDT	Bs.S 840	Bs.S 51.190	PagoMovil	COMPLETED
19/07/26, 08:35 p. m.	Compra	63.09 USDT	Bs.S 840	Bs.S 53.000	PagoMovil	COMPLETED
19/07/26, 08:29 p. m.	Compra	71.45 USDT	Bs.S 840	Bs.S 60.000	BANK	COMPLETED
19/07/26, 08:28 p. m.	Compra	59.54 USDT	Bs.S 840	Bs.S 50.000	PagoMovil	COMPLETED
19/07/26, 08:27 p. m.	Compra	69.07 USDT	Bs.S 840	Bs.S 58.000	PagoMovil	COMPLETED
19/07/26, 08:24 p. m.	Compra	74.94 USDT	Bs.S 840	Bs.S 62.916	PagoMovil	COMPLETED
19/07/26, 07:56 p. m.	Compra	107.27 USDT	Bs.S 839	Bs.S 90.000	BNCBancoNacional	COMPLETED
19/07/26, 07:52 p. m.	Compra	99.80 USDT	Bs.S 839	Bs.S 83.732	PagoMovil	COMPLETED
19/07/26, 07:50 p. m.	Compra	71.51 USDT	Bs.S 839	Bs.S 60.000	PagoMovil	COMPLETED
19/07/26, 07:50 p. m.	Compra	66.74 USDT	Bs.S 839	Bs.S 56.000	PagoMovil	COMPLETED
19/07/26, 07:44 p. m.	Compra	74.94 USDT	Bs.S 838	Bs.S 62.762	PagoMovil	COMPLETED
19/07/26, 07:39 p. m.	Compra	99.10 USDT	Bs.S 838	Bs.S 83.000	BNCBancoNacional	COMPLETED
19/07/26, 07:36 p. m.	Compra	71.64 USDT	Bs.S 838	Bs.S 60.000	Provincial	COMPLETED
19/07/26, 07:33 p. m.	Compra	179.10 USDT	Bs.S 838	Bs.S 150.000	PagoMovil	COMPLETED
19/07/26, 07:32 p. m.	Compra	59.70 USDT	Bs.S 838	Bs.S 50.000	PagoMovil	COMPLETED
19/07/26, 07:31 p. m.	Compra	63.35 USDT	Bs.S 838	Bs.S 53.060	PagoMovil	COMPLETED
19/07/26, 07:31 p. m.	Compra	60.89 USDT	Bs.S 838	Bs.S 51.000	PagoMovil	COMPLETED
19/07/26, 07:31 p. m.	Compra	70.44 USDT	Bs.S 838	Bs.S 59.000	BNCBancoNacional	COMPLETED
19/07/26, 07:31 p. m.	Compra	71.64 USDT	Bs.S 838	Bs.S 60.000	PagoMovil	COMPLETED
19/07/26, 07:29 p. m.	Compra	71.64 USDT	Bs.S 838	Bs.S 60.000	PagoMovil	COMPLETED
19/07/26, 07:23 p. m.	Compra	69.82 USDT	Bs.S 839	Bs.S 58.550	Provincial	COMPLETED
19/07/26, 07:22 p. m.	Compra	99.94 USDT	Bs.S 839	Bs.S 83.800	BDDT	COMPLETED
19/07/26, 07:21 p. m.	Compra	64.11 USDT	Bs.S 839	Bs.S 53.763	PagoMovil	COMPLETED
19/07/26, 07:19 p. m.	Compra	95.46 USDT	Bs.S 838	Bs.S 80.000	Provincial	COMPLETED
19/07/26, 07:17 p. m.	Compra	79.84 USDT	Bs.S 838	Bs.S 66.906	PagoMovil	COMPLETED
19/07/26, 07:14 p. m.	Compra	69.94 USDT	Bs.S 838	Bs.S 58.610	PagoMovil	COMPLETED
19/07/26, 07:14 p. m.	Compra	83.53 USDT	Bs.S 838	Bs.S 70.000	Provincial	COMPLETED
19/07/26, 07:13 p. m.	Compra	72.94 USDT	Bs.S 838	Bs.S 61.124	BNCBancoNacional	COMPLETED
19/07/26, 07:06 p. m.	Compra	60.13 USDT	Bs.S 832	Bs.S 50.000	PagoMovil	COMPLETED
19/07/26, 07:06 p. m.	Compra	60.13 USDT	Bs.S 832	Bs.S 50.000	PagoMovil	COMPLETED
19/07/26, 07:00 p. m.	Compra	71.42 USDT	Bs.S 840	Bs.S 60.000	PagoMovil	COMPLETED
19/07/26, 06:59 p. m.	Compra	60.99 USDT	Bs.S 840	Bs.S 51.240	PagoMovil	COMPLETED
19/07/26, 06:58 p. m.	Compra	71.42 USDT	Bs.S 840	Bs.S 60.000	PagoMovil	COMPLETED
19/07/26, 06:57 p. m.	Compra	59.52 USDT	Bs.S 840	Bs.S 50.000	PagoMovil	COMPLETED
19/07/26, 06:55 p. m.	Compra	99.94 USDT	Bs.S 840	Bs.S 83.950	PagoMovil	COMPLETED
19/07/26, 06:54 p. m.	Compra	59.52 USDT	Bs.S 840	Bs.S 50.000	PagoMovil	COMPLETED
19/07/26, 06:54 p. m.	Compra	59.51 USDT	Bs.S 840	Bs.S 50.000	PagoMovil	COMPLETED
19/07/26, 06:54 p. m.	Compra	83.32 USDT	Bs.S 840	Bs.S 70.000	PagoMovil	COMPLETED
19/07/26, 06:54 p. m.	Compra	69.94 USDT	Bs.S 840	Bs.S 58.757	PagoMovil	COMPLETED
19/07/26, 06:53 p. m.	Compra	59.51 USDT	Bs.S 840	Bs.S 50.000	PagoMovil	COMPLETED
19/07/26, 03:12 p. m.	Compra	84.13 USDT	Bs.S 837	Bs.S 70.422	PagoMovil	COMPLETED
19/07/26, 03:09 p. m.	Compra	143.36 USDT	Bs.S 837	Bs.S 120.000	PagoMovil	COMPLETED
19/07/26, 03:05 p. m.	Compra	71.68 USDT	Bs.S 837	Bs.S 60.000	BNCBancoNacional	COMPLETED
19/07/26, 03:01 p. m.	Compra	59.73 USDT	Bs.S 837	Bs.S 50.000	PagoMovil	COMPLETED
19/07/26, 02:25 p. m.	Compra	99.94 USDT	Bs.S 839	Bs.S 83.853	PagoMovil	COMPLETED
19/07/26, 02:21 p. m.	Compra	99.94 USDT	Bs.S 839	Bs.S 83.853	PagoMovil	COMPLETED
18/07/26, 09:11 p. m.	Venta	110.67 USDT	Bs.S 863	Bs.S 95.500	PagoMovil	COMPLETED
18/07/26, 09:00 p. m.	Venta	99.66 USDT	Bs.S 863	Bs.S 86.000	PagoMovil	COMPLETED
18/07/26, 08:46 p. m.	Venta	99.66 USDT	Bs.S 863	Bs.S 86.000	PagoMovil	COMPLETED
18/07/26, 08:42 p. m.	Venta	63.05 USDT	Bs.S 863	Bs.S 54.407	PagoMovil	CANCELLED
18/07/26, 08:09 p. m.	Venta	70.12 USDT	Bs.S 863	Bs.S 60.511	PagoMovil	COMPLETED
18/07/26, 08:03 p. m.	Venta	57.94 USDT	Bs.S 863	Bs.S 50.000	PagoMovil	COMPLETED
18/07/26, 08:01 p. m.	Venta	57.94 USDT	Bs.S 863	Bs.S 50.000	PagoMovil	COMPLETED
18/07/26, 07:53 p. m.	Venta	96.18 USDT	Bs.S 863	Bs.S 83.000	PagoMovil	COMPLETED
18/07/26, 07:31 p. m.	Venta	100.20 USDT	Bs.S 862	Bs.S 86.412	PagoMovil	COMPLETED
18/07/26, 07:29 p. m.	Venta	300.60 USDT	Bs.S 862	Bs.S 259.237	PagoMovil	COMPLETED
18/07/26, 04:44 p. m.	Venta	69.57 USDT	Bs.S 862	Bs.S 60.000	PagoMovil	COMPLETED
18/07/26, 04:43 p. m.	Venta	90.06 USDT	Bs.S 862	Bs.S 77.668	Bancamiga	COMPLETED
18/07/26, 04:41 p. m.	Venta	86.50 USDT	Bs.S 862	Bs.S 74.600	Bancamiga	COMPLETED
18/07/26, 04:36 p. m.	Venta	72.14 USDT	Bs.S 862	Bs.S 62.214	PagoMovil	COMPLETED
18/07/26, 03:22 p. m.	Venta	311.85 USDT	Bs.S 866	Bs.S 270.000	PagoMovil	COMPLETED
18/07/26, 01:07 p. m.	Venta	57.75 USDT	Bs.S 866	Bs.S 50.000	Bancamiga	COMPLETED
18/07/26, 01:04 p. m.	Venta	91.24 USDT	Bs.S 866	Bs.S 79.000	Bancamiga	COMPLETED
18/07/26, 11:21 a. m.	Venta	65.83 USDT	Bs.S 866	Bs.S 57.000	PagoMovil	COMPLETED
18/07/26, 11:20 a. m.	Venta	1170.94 USDT	Bs.S 863	Bs.S 1.010.755	BancoDeVenezuela	COMPLETED
18/07/26, 09:59 a. m.	Venta	57.22 USDT	Bs.S 874	Bs.S 50.000	PagoMovil	COMPLETED
18/07/26, 09:52 a. m.	Venta	80.10 USDT	Bs.S 874	Bs.S 70.000	PagoMovil	COMPLETED
17/07/26, 11:24 a. m.	Venta	999.94 USDT	Bs.S 843	Bs.S 843.249	BancoDeVenezuela	COMPLETED
16/07/26, 09:51 p. m.	Venta	134.67 USDT	Bs.S 854	Bs.S 115.000	PagoMovil	COMPLETED
16/07/26, 09:50 p. m.	Venta	81.97 USDT	Bs.S 854	Bs.S 70.000	PagoMovil	COMPLETED
16/07/26, 09:48 p. m.	Venta	76.67 USDT	Bs.S 854	Bs.S 65.470	PagoMovil	COMPLETED
16/07/26, 09:45 p. m.	Venta	97.19 USDT	Bs.S 854	Bs.S 82.991	PagoMovil	COMPLETED
16/07/26, 09:37 p. m.	Venta	58.55 USDT	Bs.S 854	Bs.S 50.000	PagoMovil	COMPLETED
16/07/26, 09:10 p. m.	Venta	60.89 USDT	Bs.S 854	Bs.S 52.000	PagoMovil	COMPLETED
16/07/26, 08:50 p. m.	Venta	200.40 USDT	Bs.S 854	Bs.S 171.122	PagoMovil	COMPLETED
16/07/26, 08:49 p. m.	Venta	58.55 USDT	Bs.S 854	Bs.S 50.000	PagoMovil	COMPLETED
16/07/26, 08:48 p. m.	Venta	58.55 USDT	Bs.S 854	Bs.S 50.000	PagoMovil	COMPLETED
16/07/26, 08:46 p. m.	Venta	99.54 USDT	Bs.S 854	Bs.S 85.000	PagoMovil	COMPLETED
16/07/26, 08:42 p. m.	Venta	100.20 USDT	Bs.S 854	Bs.S 85.561	Provincial	COMPLETED
16/07/26, 08:41 p. m.	Venta	58.63 USDT	Bs.S 853	Bs.S 50.000	PagoMovil	COMPLETED
16/07/26, 08:09 p. m.	Venta	119.62 USDT	Bs.S 853	Bs.S 102.000	PagoMovil	COMPLETED
16/07/26, 08:05 p. m.	Venta	93.81 USDT	Bs.S 853	Bs.S 80.000	PagoMovil	COMPLETED
16/07/26, 08:03 p. m.	Venta	180.36 USDT	Bs.S 853	Bs.S 153.793	PagoMovil	COMPLETED
16/07/26, 08:02 p. m.	Venta	100.85 USDT	Bs.S 853	Bs.S 86.000	PagoMovil	COMPLETED
16/07/26, 07:41 p. m.	Venta	93.35 USDT	Bs.S 853	Bs.S 79.600	PagoMovil	CANCELLED
16/07/26, 07:41 p. m.	Venta	129.00 USDT	Bs.S 853	Bs.S 110.000	PagoMovil	CANCELLED
16/07/26, 07:41 p. m.	Venta	100.20 USDT	Bs.S 853	Bs.S 85.441	PagoMovil	COMPLETED
16/07/26, 07:40 p. m.	Venta	100.20 USDT	Bs.S 853	Bs.S 85.441	PagoMovil	COMPLETED
16/07/26, 07:40 p. m.	Venta	98.39 USDT	Bs.S 853	Bs.S 83.900	PagoMovil	COMPLETED
16/07/26, 07:39 p. m.	Venta	90.30 USDT	Bs.S 853	Bs.S 77.000	PagoMovil	COMPLETED
16/07/26, 07:28 p. m.	Venta	66.84 USDT	Bs.S 853	Bs.S 57.000	PagoMovil	COMPLETED
16/07/26, 06:22 p. m.	Venta	60.75 USDT	Bs.S 856	Bs.S 52.000	PagoMovil	COMPLETED
16/07/26, 06:03 p. m.	Venta	98.55 USDT	Bs.S 856	Bs.S 84.355	mercantil	COMPLETED
16/07/26, 05:46 p. m.	Venta	81.78 USDT	Bs.S 856	Bs.S 70.000	mercantil	COMPLETED
16/07/26, 05:42 p. m.	Venta	70.10 USDT	Bs.S 856	Bs.S 60.000	mercantil	COMPLETED
16/07/26, 05:34 p. m.	Venta	120.24 USDT	Bs.S 856	Bs.S 102.913	mercantil	COMPLETED
16/07/26, 05:32 p. m.	Venta	127.93 USDT	Bs.S 856	Bs.S 109.500	PagoMovil	CANCELLED_BY_SYSTEM
16/07/26, 05:09 p. m.	Venta	76.04 USDT	Bs.S 868	Bs.S 66.000	mercantil	COMPLETED
16/07/26, 05:05 p. m.	Venta	72.58 USDT	Bs.S 868	Bs.S 63.000	PagoMovil	COMPLETED
16/07/26, 05:04 p. m.	Venta	87.56 USDT	Bs.S 868	Bs.S 76.000	mercantil	COMPLETED
16/07/26, 05:04 p. m.	Venta	945.62 USDT	Bs.S 846	Bs.S 800.000	BDDT	COMPLETED
16/07/26, 04:48 p. m.	Venta	80.16 USDT	Bs.S 868	Bs.S 69.571	Mercantil	COMPLETED
16/07/26, 04:39 p. m.	Venta	61.06 USDT	Bs.S 868	Bs.S 53.000	Mercantil	COMPLETED
16/07/26, 04:34 p. m.	Venta	78.35 USDT	Bs.S 868	Bs.S 68.000	mercantil	COMPLETED
16/07/26, 04:32 p. m.	Venta	84.11 USDT	Bs.S 868	Bs.S 73.000	mercantil	COMPLETED
16/07/26, 04:17 p. m.	Venta	100.20 USDT	Bs.S 868	Bs.S 86.964	Banesco	COMPLETED
16/07/26, 04:15 p. m.	Venta	67.51 USDT	Bs.S 868	Bs.S 58.600	Banesco	COMPLETED
16/07/26, 04:15 p. m.	Venta	59.91 USDT	Bs.S 868	Bs.S 52.000	Banesco	COMPLETED
16/07/26, 04:08 p. m.	Venta	85.17 USDT	Bs.S 868	Bs.S 73.919	Banesco	COMPLETED
16/07/26, 04:08 p. m.	Venta	100.81 USDT	Bs.S 868	Bs.S 87.500	Banesco	COMPLETED
16/07/26, 04:05 p. m.	Venta	76.04 USDT	Bs.S 868	Bs.S 66.000	Banesco	COMPLETED
16/07/26, 04:04 p. m.	Venta	86.41 USDT	Bs.S 868	Bs.S 75.000	Banesco	COMPLETED
16/07/26, 04:01 p. m.	Venta	195.87 USDT	Bs.S 868	Bs.S 170.000	Banesco	COMPLETED
16/07/26, 03:55 p. m.	Venta	90.18 USDT	Bs.S 868	Bs.S 78.267	Banesco	COMPLETED
16/07/26, 03:53 p. m.	Venta	120.98 USDT	Bs.S 868	Bs.S 105.000	Banesco	COMPLETED
16/07/26, 03:53 p. m.	Venta	90.18 USDT	Bs.S 868	Bs.S 78.267	Provincial	COMPLETED
16/07/26, 03:48 p. m.	Venta	61.42 USDT	Bs.S 863	Bs.S 53.000	Mercantil	COMPLETED
16/07/26, 03:43 p. m.	Venta	85.17 USDT	Bs.S 863	Bs.S 73.493	Provincial	CANCELLED_BY_SYSTEM
16/07/26, 03:43 p. m.	Venta	69.53 USDT	Bs.S 863	Bs.S 60.000	PagoMovil	COMPLETED
16/07/26, 03:43 p. m.	Venta	200.40 USDT	Bs.S 863	Bs.S 172.925	PagoMovil	COMPLETED
16/07/26, 03:40 p. m.	Venta	70.69 USDT	Bs.S 863	Bs.S 61.000	PagoMovil	COMPLETED
16/07/26, 03:39 p. m.	Venta	67.21 USDT	Bs.S 863	Bs.S 58.000	PagoMovil	COMPLETED
16/07/26, 03:39 p. m.	Venta	74.16 USDT	Bs.S 863	Bs.S 64.000	Mercantil	COMPLETED
16/07/26, 03:39 p. m.	Venta	75.32 USDT	Bs.S 863	Bs.S 65.000	PagoMovil	COMPLETED
16/07/26, 03:38 p. m.	Venta	75.15 USDT	Bs.S 863	Bs.S 64.847	PagoMovil	CANCELLED
16/07/26, 03:36 p. m.	Venta	98.50 USDT	Bs.S 863	Bs.S 85.000	PagoMovil	COMPLETED
16/07/26, 03:35 p. m.	Venta	95.19 USDT	Bs.S 863	Bs.S 82.139	PagoMovil	COMPLETED
16/07/26, 03:32 p. m.	Venta	80.16 USDT	Bs.S 861	Bs.S 69.010	PagoMovil	COMPLETED
16/07/26, 03:27 p. m.	Venta	64.10 USDT	Bs.S 858	Bs.S 55.000	PagoMovil	COMPLETED
16/07/26, 03:27 p. m.	Venta	70.14 USDT	Bs.S 858	Bs.S 60.180	PagoMovil	COMPLETED
16/07/26, 03:27 p. m.	Venta	116.55 USDT	Bs.S 858	Bs.S 100.000	PagoMovil	COMPLETED
16/07/26, 03:27 p. m.	Venta	59.44 USDT	Bs.S 858	Bs.S 51.000	PagoMovil	COMPLETED
16/07/26, 03:24 p. m.	Venta	85.06 USDT	Bs.S 858	Bs.S 72.981	PagoMovil	COMPLETED
16/07/26, 03:24 p. m.	Venta	209.79 USDT	Bs.S 858	Bs.S 180.000	PagoMovil	COMPLETED
16/07/26, 03:22 p. m.	Venta	69.93 USDT	Bs.S 858	Bs.S 60.000	PagoMovil	COMPLETED
16/07/26, 03:21 p. m.	Venta	84.73 USDT	Bs.S 858	Bs.S 72.700	PagoMovil	COMPLETED
16/07/26, 03:21 p. m.	Venta	93.24 USDT	Bs.S 858	Bs.S 80.000	PagoMovil	COMPLETED
16/07/26, 03:20 p. m.	Venta	116.55 USDT	Bs.S 858	Bs.S 100.000	PagoMovil	COMPLETED
16/07/26, 03:10 p. m.	Venta	65.51 USDT	Bs.S 855	Bs.S 56.000	PagoMovil	COMPLETED
16/07/26, 03:10 p. m.	Venta	100.06 USDT	Bs.S 855	Bs.S 85.531	PagoMovil	COMPLETED
16/07/26, 03:09 p. m.	Venta	98.16 USDT	Bs.S 855	Bs.S 83.914	PagoMovil	COMPLETED
16/07/26, 03:09 p. m.	Venta	130.26 USDT	Bs.S 855	Bs.S 111.346	PagoMovil	COMPLETED
16/07/26, 03:09 p. m.	Venta	85.10 USDT	Bs.S 855	Bs.S 72.750	PagoMovil	COMPLETED
16/07/26, 03:09 p. m.	Venta	75.80 USDT	Bs.S 855	Bs.S 64.800	PagoMovil	COMPLETED
16/07/26, 03:09 p. m.	Venta	81.89 USDT	Bs.S 855	Bs.S 70.000	PagoMovil	COMPLETED
16/07/26, 03:08 p. m.	Venta	65.27 USDT	Bs.S 855	Bs.S 55.800	PagoMovil	COMPLETED
16/07/26, 03:05 p. m.	Venta	70.14 USDT	Bs.S 855	Bs.S 59.956	PagoMovil	COMPLETED
16/07/26, 03:04 p. m.	Venta	60.06 USDT	Bs.S 855	Bs.S 51.339	PagoMovil	COMPLETED
16/07/26, 02:55 p. m.	Venta	58.83 USDT	Bs.S 850	Bs.S 50.000	PagoMovil	COMPLETED
16/07/26, 02:40 p. m.	Venta	58.83 USDT	Bs.S 850	Bs.S 50.000	PagoMovil	COMPLETED
16/07/26, 02:40 p. m.	Venta	94.12 USDT	Bs.S 850	Bs.S 80.000	PagoMovil	COMPLETED
16/07/26, 02:39 p. m.	Venta	110.22 USDT	Bs.S 850	Bs.S 93.676	PagoMovil	COMPLETED
16/07/26, 02:39 p. m.	Venta	63.53 USDT	Bs.S 850	Bs.S 54.000	BNCBancoNacional	CANCELLED_BY_SYSTEM
16/07/26, 02:39 p. m.	Venta	58.83 USDT	Bs.S 850	Bs.S 50.000	PagoMovil	COMPLETED
16/07/26, 02:38 p. m.	Venta	75.06 USDT	Bs.S 850	Bs.S 63.793	PagoMovil	COMPLETED
16/07/26, 02:38 p. m.	Venta	86.77 USDT	Bs.S 850	Bs.S 73.746	PagoMovil	COMPLETED
16/07/26, 02:36 p. m.	Venta	70.14 USDT	Bs.S 850	Bs.S 59.612	PagoMovil	COMPLETED
16/07/26, 02:36 p. m.	Venta	80.83 USDT	Bs.S 850	Bs.S 68.700	PagoMovil	COMPLETED
16/07/26, 02:36 p. m.	Venta	78.06 USDT	Bs.S 850	Bs.S 66.343	PagoMovil	COMPLETED
16/07/26, 02:36 p. m.	Venta	122.40 USDT	Bs.S 850	Bs.S 104.030	PagoMovil	COMPLETED
16/07/26, 02:35 p. m.	Venta	70.14 USDT	Bs.S 850	Bs.S 59.612	PagoMovil	COMPLETED
16/07/26, 02:34 p. m.	Venta	576.15 USDT	Bs.S 850	Bs.S 489.670	PagoMovil	CANCELLED
16/07/26, 10:32 a. m.	Compra	15.94 USDT	Bs.S 798	Bs.S 12.720	PagoMovil	COMPLETED
16/07/26, 10:30 a. m.	Compra	19.07 USDT	Bs.S 798	Bs.S 15.218	PagoMovil	COMPLETED
16/07/26, 10:29 a. m.	Compra	12.53 USDT	Bs.S 798	Bs.S 10.000	PagoMovil	COMPLETED
16/07/26, 10:29 a. m.	Compra	13.98 USDT	Bs.S 798	Bs.S 11.156	PagoMovil	COMPLETED
16/07/26, 10:29 a. m.	Compra	13.94 USDT	Bs.S 798	Bs.S 11.124	PagoMovil	COMPLETED
16/07/26, 10:29 a. m.	Compra	20.05 USDT	Bs.S 798	Bs.S 16.000	PagoMovil	COMPLETED
16/07/26, 10:28 a. m.	Compra	15.11 USDT	Bs.S 798	Bs.S 12.058	PagoMovil	COMPLETED
16/07/26, 10:28 a. m.	Compra	12.53 USDT	Bs.S 798	Bs.S 10.000	PagoMovil	COMPLETED
16/07/26, 10:28 a. m.	Compra	22.93 USDT	Bs.S 798	Bs.S 18.300	PagoMovil	COMPLETED
16/07/26, 10:27 a. m.	Compra	29.94 USDT	Bs.S 798	Bs.S 23.892	PagoMovil	COMPLETED
16/07/26, 10:27 a. m.	Compra	14.94 USDT	Bs.S 798	Bs.S 11.922	PagoMovil	COMPLETED
16/07/26, 10:26 a. m.	Compra	19.94 USDT	Bs.S 798	Bs.S 15.912	PagoMovil	COMPLETED
16/07/26, 10:25 a. m.	Compra	14.94 USDT	Bs.S 798	Bs.S 11.922	PagoMovil	COMPLETED
16/07/26, 10:25 a. m.	Compra	12.53 USDT	Bs.S 798	Bs.S 10.000	PagoMovil	COMPLETED
16/07/26, 10:25 a. m.	Compra	15.35 USDT	Bs.S 799	Bs.S 12.260	PagoMovil	COMPLETED
16/07/26, 09:36 a. m.	Compra	99.94 USDT	Bs.S 820	Bs.S 81.951	BancoDeVenezuela	CANCELLED
16/07/26, 09:36 a. m.	Compra	85.36 USDT	Bs.S 820	Bs.S 70.000	BANK	CANCELLED
16/07/26, 09:36 a. m.	Compra	107.31 USDT	Bs.S 820	Bs.S 88.000	PagoMovil	CANCELLED
16/07/26, 09:36 a. m.	Compra	103.94 USDT	Bs.S 820	Bs.S 85.231	BancoDeVenezuela	CANCELLED
16/07/26, 09:36 a. m.	Compra	176.82 USDT	Bs.S 820	Bs.S 145.000	PagoMovil	CANCELLED
16/07/26, 09:36 a. m.	Compra	60.97 USDT	Bs.S 820	Bs.S 50.000	BancoDeVenezuela	COMPLETED
16/07/26, 09:36 a. m.	Compra	101.21 USDT	Bs.S 820	Bs.S 83.000	BANK	COMPLETED
16/07/26, 09:36 a. m.	Compra	99.94 USDT	Bs.S 820	Bs.S 81.951	BancoDeVenezuela	COMPLETED
16/07/26, 09:36 a. m.	Compra	97.56 USDT	Bs.S 820	Bs.S 80.000	BancoDeVenezuela	COMPLETED
16/07/26, 09:36 a. m.	Compra	99.94 USDT	Bs.S 820	Bs.S 81.951	PagoMovil	COMPLETED
16/07/26, 09:36 a. m.	Compra	121.95 USDT	Bs.S 820	Bs.S 100.000	BANK	COMPLETED
16/07/26, 09:36 a. m.	Compra	97.20 USDT	Bs.S 823	Bs.S 80.000	BancoDeVenezuela	COMPLETED
15/07/26, 09:45 p. m.	Compra	74.99 USDT	Bs.S 845	Bs.S 63.375	BANK	COMPLETED
15/07/26, 09:45 p. m.	Compra	91.83 USDT	Bs.S 845	Bs.S 77.600	BANK	COMPLETED
15/07/26, 09:45 p. m.	Compra	69.94 USDT	Bs.S 845	Bs.S 59.099	BancoDeVenezuela	COMPLETED
15/07/26, 09:45 p. m.	Compra	86.08 USDT	Bs.S 845	Bs.S 72.746	BancoDeVenezuela	COMPLETED
15/07/26, 09:44 p. m.	Compra	99.80 USDT	Bs.S 845	Bs.S 84.331	BancoDeVenezuela	COMPLETED
15/07/26, 09:30 p. m.	Compra	99.94 USDT	Bs.S 846	Bs.S 84.570	PagoMovil	COMPLETED
15/07/26, 09:30 p. m.	Compra	274.94 USDT	Bs.S 846	Bs.S 232.657	PagoMovil	COMPLETED
15/07/26, 09:30 p. m.	Compra	99.94 USDT	Bs.S 846	Bs.S 84.570	PagoMovil	COMPLETED
15/07/26, 09:30 p. m.	Compra	99.94 USDT	Bs.S 846	Bs.S 84.570	PagoMovil	COMPLETED
15/07/26, 09:30 p. m.	Compra	99.94 USDT	Bs.S 846	Bs.S 84.570	PagoMovil	COMPLETED
15/07/26, 09:30 p. m.	Compra	111.50 USDT	Bs.S 846	Bs.S 94.352	PagoMovil	COMPLETED
15/07/26, 09:17 p. m.	Compra	149.94 USDT	Bs.S 846	Bs.S 126.881	PagoMovil	COMPLETED
15/07/26, 09:17 p. m.	Compra	139.94 USDT	Bs.S 846	Bs.S 118.419	PagoMovil	COMPLETED
15/07/26, 09:17 p. m.	Compra	67.05 USDT	Bs.S 846	Bs.S 56.738	PagoMovil	COMPLETED
15/07/26, 09:17 p. m.	Compra	106.35 USDT	Bs.S 846	Bs.S 90.000	PagoMovil	COMPLETED
15/07/26, 09:17 p. m.	Compra	94.53 USDT	Bs.S 846	Bs.S 80.000	PagoMovil	COMPLETED
15/07/26, 09:17 p. m.	Compra	299.94 USDT	Bs.S 846	Bs.S 253.812	PagoMovil	COMPLETED
15/07/26, 09:17 p. m.	Compra	199.60 USDT	Bs.S 846	Bs.S 168.904	PagoMovil	COMPLETED
15/07/26, 09:16 p. m.	Compra	160.68 USDT	Bs.S 846	Bs.S 135.970	PagoMovil	COMPLETED
15/07/26, 09:16 p. m.	Compra	74.85 USDT	Bs.S 846	Bs.S 63.339	PagoMovil	COMPLETED
15/07/26, 09:02 p. m.	Compra	97.43 USDT	Bs.S 846	Bs.S 82.450	BancoDeVenezuela	COMPLETED
15/07/26, 09:02 p. m.	Compra	106.35 USDT	Bs.S 846	Bs.S 90.000	PagoMovil	COMPLETED
15/07/26, 09:02 p. m.	Compra	67.14 USDT	Bs.S 846	Bs.S 56.818	PagoMovil	COMPLETED
15/07/26, 09:02 p. m.	Compra	99.26 USDT	Bs.S 846	Bs.S 84.000	PagoMovil	COMPLETED
15/07/26, 09:02 p. m.	Compra	141.80 USDT	Bs.S 846	Bs.S 120.000	BancoDeVenezuela	COMPLETED
15/07/26, 08:52 p. m.	Compra	432.04 USDT	Bs.S 846	Bs.S 365.600	BancoDeVenezuela	COMPLETED
15/07/26, 08:52 p. m.	Compra	63.94 USDT	Bs.S 846	Bs.S 54.107	BancoDeVenezuela	COMPLETED
15/07/26, 08:52 p. m.	Compra	424.24 USDT	Bs.S 846	Bs.S 359.000	BancoDeVenezuela	COMPLETED
15/07/26, 08:52 p. m.	Compra	99.80 USDT	Bs.S 846	Bs.S 84.452	BancoDeVenezuela	COMPLETED
15/07/26, 08:52 p. m.	Compra	198.53 USDT	Bs.S 846	Bs.S 168.000	PagoMovil	COMPLETED
15/07/26, 08:52 p. m.	Compra	141.80 USDT	Bs.S 846	Bs.S 120.000	PagoMovil	COMPLETED
15/07/26, 08:52 p. m.	Compra	92.94 USDT	Bs.S 846	Bs.S 78.647	BANK	COMPLETED
15/07/26, 08:52 p. m.	Compra	180.80 USDT	Bs.S 846	Bs.S 153.000	BANK	COMPLETED
15/07/26, 08:52 p. m.	Compra	149.70 USDT	Bs.S 846	Bs.S 126.678	PagoMovil	COMPLETED
15/07/26, 06:36 p. m.	Venta	57.50 USDT	Bs.S 887	Bs.S 51.000	PagoMovil	COMPLETED
15/07/26, 06:31 p. m.	Venta	67.65 USDT	Bs.S 887	Bs.S 60.000	PagoMovil	COMPLETED
15/07/26, 06:22 p. m.	Venta	100.20 USDT	Bs.S 887	Bs.S 88.867	PagoMovil	COMPLETED
15/07/26, 05:44 p. m.	Venta	100.20 USDT	Bs.S 887	Bs.S 88.867	PagoMovil	CANCELLED
15/07/26, 05:44 p. m.	Venta	98.43 USDT	Bs.S 887	Bs.S 87.300	PagoMovil	COMPLETED
15/07/26, 05:32 p. m.	Venta	133.26 USDT	Bs.S 887	Bs.S 118.188	PagoMovil	COMPLETED
15/07/26, 05:25 p. m.	Venta	101.47 USDT	Bs.S 887	Bs.S 90.000	PagoMovil	COMPLETED
15/07/26, 05:11 p. m.	Venta	225.50 USDT	Bs.S 887	Bs.S 200.000	PagoMovil	CANCELLED_BY_SYSTEM
15/07/26, 04:51 p. m.	Venta	200.69 USDT	Bs.S 887	Bs.S 178.000	PagoMovil	COMPLETED
15/07/26, 04:16 p. m.	Venta	84.56 USDT	Bs.S 887	Bs.S 75.000	PagoMovil	COMPLETED
15/07/26, 04:07 p. m.	Venta	202.95 USDT	Bs.S 887	Bs.S 180.000	PagoMovil	COMPLETED
15/07/26, 03:59 p. m.	Venta	98.03 USDT	Bs.S 887	Bs.S 86.950	PagoMovil	COMPLETED
15/07/26, 03:59 p. m.	Venta	131.92 USDT	Bs.S 887	Bs.S 117.000	PagoMovil	COMPLETED
15/07/26, 03:58 p. m.	Venta	91.32 USDT	Bs.S 887	Bs.S 81.000	BNCBancoNacional	COMPLETED
15/07/26, 02:35 p. m.	Venta	107.23 USDT	Bs.S 886	Bs.S 95.000	PagoMovil	COMPLETED
15/07/26, 02:25 p. m.	Venta	100.20 USDT	Bs.S 885	Bs.S 88.677	PagoMovil	COMPLETED
15/07/26, 02:25 p. m.	Venta	1128.92 USDT	Bs.S 886	Bs.S 1.000.000	BancoDeVenezuela	COMPLETED
15/07/26, 02:12 p. m.	Venta	67.79 USDT	Bs.S 885	Bs.S 60.000	PagoMovil	COMPLETED
15/07/26, 02:07 p. m.	Venta	1499.94 USDT	Bs.S 883	Bs.S 1.323.847	BancoDeVenezuela	COMPLETED
15/07/26, 02:00 p. m.	Venta	90.41 USDT	Bs.S 885	Bs.S 80.000	PagoMovil	COMPLETED
15/07/26, 11:13 a. m.	Compra	149.70 USDT	Bs.S 858	Bs.S 128.504	PagoMovil	COMPLETED
15/07/26, 10:41 a. m.	Compra	89.94 USDT	Bs.S 858	Bs.S 77.205	PagoMovil	COMPLETED
15/07/26, 10:40 a. m.	Compra	89.82 USDT	Bs.S 858	Bs.S 77.102	PagoMovil	COMPLETED
15/07/26, 10:08 a. m.	Compra	59.94 USDT	Bs.S 856	Bs.S 51.330	PagoMovil	COMPLETED
15/07/26, 10:07 a. m.	Compra	69.39 USDT	Bs.S 856	Bs.S 59.423	PagoMovil	COMPLETED
15/07/26, 10:07 a. m.	Compra	101.72 USDT	Bs.S 856	Bs.S 87.109	PagoMovil	COMPLETED
15/07/26, 10:06 a. m.	Compra	65.97 USDT	Bs.S 856	Bs.S 56.500	PagoMovil	COMPLETED
15/07/26, 10:05 a. m.	Compra	58.38 USDT	Bs.S 856	Bs.S 50.000	PagoMovil	COMPLETED
15/07/26, 10:05 a. m.	Compra	67.72 USDT	Bs.S 856	Bs.S 58.000	PagoMovil	COMPLETED
15/07/26, 10:04 a. m.	Compra	124.94 USDT	Bs.S 856	Bs.S 106.994	PagoMovil	COMPLETED
15/07/26, 10:03 a. m.	Compra	65.21 USDT	Bs.S 856	Bs.S 55.850	PagoMovil	COMPLETED
15/07/26, 10:02 a. m.	Compra	59.94 USDT	Bs.S 856	Bs.S 51.330	PagoMovil	COMPLETED
15/07/26, 10:01 a. m.	Compra	72.14 USDT	Bs.S 856	Bs.S 61.778	PagoMovil	COMPLETED
15/07/26, 10:00 a. m.	Compra	60.02 USDT	Bs.S 856	Bs.S 51.400	PagoMovil	COMPLETED
15/07/26, 09:14 a. m.	Compra	88.64 USDT	Bs.S 850	Bs.S 75.301	Provincial	COMPLETED
15/07/26, 09:14 a. m.	Compra	89.94 USDT	Bs.S 850	Bs.S 76.405	PagoMovil	COMPLETED
15/07/26, 09:14 a. m.	Compra	71.80 USDT	Bs.S 850	Bs.S 61.000	Provincial	COMPLETED
15/07/26, 09:14 a. m.	Compra	59.94 USDT	Bs.S 850	Bs.S 50.920	PagoMovil	COMPLETED
15/07/26, 09:14 a. m.	Compra	279.44 USDT	Bs.S 850	Bs.S 237.387	PagoMovil	COMPLETED
15/07/26, 09:14 a. m.	Compra	58.85 USDT	Bs.S 850	Bs.S 50.000	PagoMovil	COMPLETED
15/07/26, 09:13 a. m.	Compra	59.94 USDT	Bs.S 850	Bs.S 50.920	PagoMovil	COMPLETED
15/07/26, 09:13 a. m.	Compra	85.85 USDT	Bs.S 850	Bs.S 72.938	Provincial	COMPLETED
15/07/26, 09:13 a. m.	Compra	68.27 USDT	Bs.S 850	Bs.S 58.000	PagoMovil	COMPLETED
15/07/26, 09:12 a. m.	Compra	119.94 USDT	Bs.S 850	Bs.S 101.890	PagoMovil	COMPLETED
15/07/26, 09:12 a. m.	Compra	82.40 USDT	Bs.S 850	Bs.S 70.000	Provincial	COMPLETED
15/07/26, 09:11 a. m.	Compra	58.85 USDT	Bs.S 850	Bs.S 50.000	PagoMovil	COMPLETED
15/07/26, 09:11 a. m.	Compra	499.00 USDT	Bs.S 850	Bs.S 423.905	PagoMovil	COMPLETED
14/07/26, 08:19 p. m.	Venta	1153.25 USDT	Bs.S 867	Bs.S 1.000.000	BancoDeVenezuela	COMPLETED
14/07/26, 07:07 p. m.	Venta	59.79 USDT	Bs.S 870	Bs.S 52.000	PagoMovil	COMPLETED
14/07/26, 07:07 p. m.	Venta	63.24 USDT	Bs.S 870	Bs.S 55.000	PagoMovil	COMPLETED
14/07/26, 07:06 p. m.	Venta	148.99 USDT	Bs.S 870	Bs.S 129.582	PagoMovil	COMPLETED
14/07/26, 07:01 p. m.	Venta	127.48 USDT	Bs.S 870	Bs.S 110.875	Bancamiga	COMPLETED
14/07/26, 07:00 p. m.	Venta	80.48 USDT	Bs.S 870	Bs.S 70.000	PagoMovil	COMPLETED
14/07/26, 07:00 p. m.	Venta	60.94 USDT	Bs.S 870	Bs.S 53.000	PagoMovil	COMPLETED
14/07/26, 06:53 p. m.	Venta	114.98 USDT	Bs.S 870	Bs.S 100.000	PagoMovil	COMPLETED
14/07/26, 06:48 p. m.	Venta	98.88 USDT	Bs.S 870	Bs.S 86.000	Bancamiga	COMPLETED
14/07/26, 06:46 p. m.	Venta	159.82 USDT	Bs.S 870	Bs.S 139.000	PagoMovil	COMPLETED
14/07/26, 06:45 p. m.	Venta	79.46 USDT	Bs.S 870	Bs.S 69.110	PagoMovil	COMPLETED
14/07/26, 06:06 p. m.	Venta	880.06 USDT	Bs.S 869	Bs.S 764.684	BancoPlaza	COMPLETED
14/07/26, 05:29 p. m.	Venta	103.57 USDT	Bs.S 869	Bs.S 90.000	PagoMovil	COMPLETED
14/07/26, 05:21 p. m.	Venta	1153.25 USDT	Bs.S 867	Bs.S 1.000.000	BancoDeVenezuela	COMPLETED
14/07/26, 01:13 p. m.	Venta	100.12 USDT	Bs.S 855	Bs.S 85.600	BBVABank	COMPLETED
14/07/26, 01:11 p. m.	Venta	58.48 USDT	Bs.S 855	Bs.S 50.000	PagoMovil	COMPLETED
14/07/26, 01:04 p. m.	Venta	101.64 USDT	Bs.S 855	Bs.S 86.900	Provincial	COMPLETED
14/07/26, 12:59 p. m.	Venta	70.18 USDT	Bs.S 855	Bs.S 60.000	Provincial	CANCELLED
14/07/26, 12:54 p. m.	Venta	91.23 USDT	Bs.S 855	Bs.S 78.000	Plaza	COMPLETED
14/07/26, 12:49 p. m.	Venta	136.27 USDT	Bs.S 855	Bs.S 116.497	Plaza	COMPLETED
14/07/26, 12:43 p. m.	Venta	501.00 USDT	Bs.S 855	Bs.S 428.305	Provincial	COMPLETED
"""

def parse_bs(s: str) -> float:
    # "Bs.S 1.000.000" or "Bs.S 52.000" -> Venezuelan thousands with dots
    s = s.replace('Bs.S', '').strip()
    # if last part after last dot has 3 digits, all dots are thousands
    # if last has 1-2 digits, last is decimal (rare in this dump)
    parts = s.split('.')
    if len(parts) == 1:
        return float(parts[0].replace(',', '.'))
    if len(parts[-1]) == 3:
        return float(''.join(parts))
    # decimal
    return float(''.join(parts[:-1]) + '.' + parts[-1])

pat = re.compile(
    r'(\d{2}/\d{2}/\d{2}).*?\t(Compra|Venta)\t([\d.]+)\s*USDT\tBs\.S\s*([\d.]+)\tBs\.S\s*([\d.]+)\t.*?\t(COMPLETED|CANCELLED(?:_BY_SYSTEM)?)'
)

rows = []
for line in RAW.strip().splitlines():
    line = line.strip()
    if not line:
        continue
    m = pat.search(line)
    if not m:
        print('UNPARSED:', line[:80])
        continue
    date, typ, usdt, price, total, status = m.groups()
    rows.append({
        'date': date,
        'type': typ,
        'usdt': float(usdt),
        'price': float(price),
        'total': parse_bs(total),
        'status': status,
    })

ok = [r for r in rows if r['status'] == 'COMPLETED']
print(f'Total lineas parseadas: {len(rows)} | COMPLETED: {len(ok)} | no-COMPLETED: {len(rows)-len(ok)}')

by_day = defaultdict(lambda: {
    'buy_u': 0.0, 'buy_bs': 0.0, 'buy_n': 0,
    'sell_u': 0.0, 'sell_bs': 0.0, 'sell_n': 0,
})

tot_buy_u = tot_buy_bs = tot_sell_u = tot_sell_bs = 0.0
n_buy = n_sell = 0

for r in ok:
    d = by_day[r['date']]
    if r['type'] == 'Compra':
        d['buy_u'] += r['usdt']; d['buy_bs'] += r['total']; d['buy_n'] += 1
        tot_buy_u += r['usdt']; tot_buy_bs += r['total']; n_buy += 1
    else:
        d['sell_u'] += r['usdt']; d['sell_bs'] += r['total']; d['sell_n'] += 1
        tot_sell_u += r['usdt']; tot_sell_bs += r['total']; n_sell += 1

def fmt_bs(n):
    return f'{n:,.0f}'.replace(',', '.')

print('\n=== POR DIA (COMPLETED) ===')
for d in sorted(by_day.keys(), key=lambda x: (x[6:8], x[3:5], x[0:2])):
    x = by_day[d]
    avg_b = x['buy_bs']/x['buy_u'] if x['buy_u'] else 0
    avg_s = x['sell_bs']/x['sell_u'] if x['sell_u'] else 0
    print(f"{d}: COMPRAS {x['buy_n']:3d} | {x['buy_u']:10.2f} USDT | Bs {fmt_bs(x['buy_bs']):>14} | avg {avg_b:7.2f}")
    print(f"         VENTAS  {x['sell_n']:3d} | {x['sell_u']:10.2f} USDT | Bs {fmt_bs(x['sell_bs']):>14} | avg {avg_s:7.2f}")
    print(f"         Net USDT (compra-venta): {x['buy_u']-x['sell_u']:+.2f}")

print('\n=== TOTAL PERIODO (14–20 jul, COMPLETED) ===')
print(f'Compras: {n_buy} ops | {tot_buy_u:.2f} USDT | Bs {fmt_bs(tot_buy_bs)} | tasa media {tot_buy_bs/tot_buy_u:.2f}')
print(f'Ventas:  {n_sell} ops | {tot_sell_u:.2f} USDT | Bs {fmt_bs(tot_sell_bs)} | tasa media {tot_sell_bs/tot_sell_u:.2f}')
net_u = tot_buy_u - tot_sell_u
print(f'Neto USDT (compras - ventas): {net_u:+.2f} USDT  {"(sobrante comprado / inventario)" if net_u>0 else "(desbalance por vender de mas)"}')
print(f'Neto Bs (recibidos - pagados): {tot_sell_bs - tot_buy_bs:+,.0f}'.replace(',', '.'))

# Emparejar por volumen: ganancia sobre el USDT que se vendió y se pudo "cerrar" con compras
matched = min(tot_buy_u, tot_sell_u)
avg_buy = tot_buy_bs / tot_buy_u
avg_sell = tot_sell_bs / tot_sell_u
spread = avg_sell - avg_buy
profit_matched_bs = matched * spread
print('\n=== RENTABILIDAD (sobre volumen emparejado) ===')
print(f'USDT emparejables (min compra/venta): {matched:.2f}')
print(f'Tasa media compra: {avg_buy:.2f} | venta: {avg_sell:.2f} | spread: {spread:.2f} Bs/USDT')
print(f'Ganancia estimada en Bs (matched * spread): Bs {fmt_bs(profit_matched_bs)}')
print(f'Ganancia estimada en USDT (a tasa compra media): {profit_matched_bs/avg_buy:.2f} USDT')
print(f'ROI sobre costo de lo vendido (matched*avg_buy): {100*profit_matched_bs/(matched*avg_buy):.2f}%')

# Lectura "cuanto compre adicional = ganancia"
# Si operas: ventas generan Bs, con esos Bs recompras USDT. El exceso de USDT comprado
# respecto a lo vendido, si viene de la brecha de tasas, es la ganancia en USDT.
print('\n=== INTERPRETACION "COMPRA ADICIONAL = GANANCIA" ===')
print(f'Vendiste {tot_sell_u:.2f} USDT y recibiste Bs {fmt_bs(tot_sell_bs)}')
print(f'Con ese efectivo, a tu tasa media de compra ({avg_buy:.2f}), podrias recomprar:')
recomprable = tot_sell_bs / avg_buy
print(f'  {recomprable:.2f} USDT')
print(f'Recompraste realmente: {tot_buy_u:.2f} USDT')
print(f'Diferencia recompra vs ventas originales: {recomprable - tot_sell_u:+.2f} USDT (ganancia teorica en USDT si reinvirtieras TODO el Bs de ventas)')
print(f'Sobrante inventario real (compras - ventas): {net_u:+.2f} USDT')
print('(Si el sobrante real >> ganancia teorica, mezclaste capital nuevo; si es menor, parte del Bs se quedo sin reinvertir o hubo costos.)')
