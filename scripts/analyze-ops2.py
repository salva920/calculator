# -*- coding: utf-8 -*-
import re
from collections import defaultdict

RAW = r"""
27/07/26, 08:49 a. m.	Compra	117.14 USDT	Bs.S 854	Bs.S 100.000	PagoMovil	COMPLETED
27/07/26, 08:49 a. m.	Compra	58.57 USDT	Bs.S 854	Bs.S 50.000	PagoMovil	COMPLETED
27/07/26, 08:49 a. m.	Compra	99.57 USDT	Bs.S 854	Bs.S 85.000	PagoMovil	COMPLETED
27/07/26, 08:43 a. m.	Compra	201.45 USDT	Bs.S 854	Bs.S 171.960	PagoMovil	COMPLETED
27/07/26, 08:43 a. m.	Compra	99.57 USDT	Bs.S 854	Bs.S 85.000	PagoMovil	COMPLETED
27/07/26, 08:39 a. m.	Compra	70.29 USDT	Bs.S 854	Bs.S 60.000	PagoMovil	COMPLETED
27/07/26, 08:24 a. m.	Compra	437.01 USDT	Bs.S 854	Bs.S 373.000	Mercantil	COMPLETED
27/07/26, 08:23 a. m.	Compra	100.76 USDT	Bs.S 854	Bs.S 86.000	Mercantil	COMPLETED
27/07/26, 08:23 a. m.	Compra	89.94 USDT	Bs.S 854	Bs.S 76.765	Mercantil	COMPLETED
27/07/26, 08:23 a. m.	Compra	434.80 USDT	Bs.S 854	Bs.S 371.114	BancoDelTesoro	COMPLETED
27/07/26, 08:23 a. m.	Compra	66.95 USDT	Bs.S 854	Bs.S 57.146	BancoDelTesoro	COMPLETED
27/07/26, 08:18 a. m.	Compra	59.94 USDT	Bs.S 854	Bs.S 51.159	PagoMovil	BUYER_PAYED
27/07/26, 08:18 a. m.	Compra	181.29 USDT	Bs.S 854	Bs.S 154.731	PagoMovil	COMPLETED
27/07/26, 08:18 a. m.	Compra	69.94 USDT	Bs.S 854	Bs.S 59.694	PagoMovil	COMPLETED
27/07/26, 08:18 a. m.	Compra	140.59 USDT	Bs.S 854	Bs.S 120.000	PagoMovil	COMPLETED
27/07/26, 08:16 a. m.	Compra	97.94 USDT	Bs.S 854	Bs.S 83.592	PagoMovil	COMPLETED
27/07/26, 08:15 a. m.	Compra	87.21 USDT	Bs.S 854	Bs.S 74.434	BNCBancoNacional	COMPLETED
27/07/26, 08:13 a. m.	Compra	79.14 USDT	Bs.S 854	Bs.S 67.567	PagoMovil	COMPLETED
27/07/26, 08:12 a. m.	Compra	59.73 USDT	Bs.S 854	Bs.S 51.000	BNCBancoNacional	COMPLETED
26/07/26, 07:38 p. m.	Compra	64.58 USDT	Bs.S 852	Bs.S 55.000	BNCBancoNacional	COMPLETED
26/07/26, 07:37 p. m.	Compra	59.89 USDT	Bs.S 852	Bs.S 51.000	PagoMovil	COMPLETED
26/07/26, 07:36 p. m.	Compra	99.80 USDT	Bs.S 852	Bs.S 84.985	Mercantil	COMPLETED
26/07/26, 07:35 p. m.	Compra	115.77 USDT	Bs.S 852	Bs.S 98.584	PagoMovil	COMPLETED
26/07/26, 07:35 p. m.	Compra	64.58 USDT	Bs.S 852	Bs.S 55.000	PagoMovil	COMPLETED
26/07/26, 07:35 p. m.	Compra	99.80 USDT	Bs.S 852	Bs.S 84.985	Mercantil	COMPLETED
26/07/26, 07:35 p. m.	Compra	199.60 USDT	Bs.S 852	Bs.S 169.969	PagoMovil	COMPLETED
26/07/26, 07:33 p. m.	Compra	104.63 USDT	Bs.S 853	Bs.S 89.250	PagoMovil	COMPLETED
26/07/26, 07:31 p. m.	Compra	69.94 USDT	Bs.S 853	Bs.S 59.659	Provincial	COMPLETED
26/07/26, 07:31 p. m.	Compra	169.66 USDT	Bs.S 853	Bs.S 144.720	PagoMovil	COMPLETED
26/07/26, 07:30 p. m.	Compra	76.85 USDT	Bs.S 853	Bs.S 65.553	PagoMovil	COMPLETED
26/07/26, 07:30 p. m.	Compra	99.80 USDT	Bs.S 853	Bs.S 85.129	PagoMovil	COMPLETED
26/07/26, 07:29 p. m.	Compra	99.80 USDT	Bs.S 853	Bs.S 85.129	PagoMovil	COMPLETED
26/07/26, 07:25 p. m.	Compra	59.94 USDT	Bs.S 853	Bs.S 51.129	PagoMovil	COMPLETED
26/07/26, 07:25 p. m.	Compra	74.94 USDT	Bs.S 853	Bs.S 63.924	PagoMovil	COMPLETED
26/07/26, 07:25 p. m.	Compra	99.80 USDT	Bs.S 853	Bs.S 85.129	PagoMovil	COMPLETED
26/07/26, 07:23 p. m.	Compra	59.78 USDT	Bs.S 853	Bs.S 51.000	BNCBancoNacional	COMPLETED
26/07/26, 07:15 p. m.	Compra	59.94 USDT	Bs.S 853	Bs.S 51.129	PagoMovil	COMPLETED
26/07/26, 07:14 p. m.	Compra	70.33 USDT	Bs.S 853	Bs.S 60.000	PagoMovil	COMPLETED
26/07/26, 07:13 p. m.	Compra	64.47 USDT	Bs.S 853	Bs.S 55.000	PagoMovil	COMPLETED
26/07/26, 07:13 p. m.	Compra	64.94 USDT	Bs.S 853	Bs.S 55.394	PagoMovil	COMPLETED
26/07/26, 07:13 p. m.	Compra	79.84 USDT	Bs.S 853	Bs.S 68.104	PagoMovil	COMPLETED
26/07/26, 07:12 p. m.	Compra	70.33 USDT	Bs.S 853	Bs.S 60.000	PagoMovil	COMPLETED
26/07/26, 07:11 p. m.	Compra	60.96 USDT	Bs.S 853	Bs.S 52.000	PagoMovil	COMPLETED
26/07/26, 07:11 p. m.	Compra	70.95 USDT	Bs.S 853	Bs.S 60.520	PagoMovil	COMPLETED
26/07/26, 07:10 p. m.	Compra	58.61 USDT	Bs.S 853	Bs.S 50.000	PagoMovil	COMPLETED
26/07/26, 07:09 p. m.	Compra	59.94 USDT	Bs.S 853	Bs.S 51.129	PagoMovil	COMPLETED
26/07/26, 07:08 p. m.	Compra	149.70 USDT	Bs.S 853	Bs.S 127.694	Provincial	COMPLETED
26/07/26, 07:07 p. m.	Compra	58.61 USDT	Bs.S 853	Bs.S 50.000	PagoMovil	COMPLETED
26/07/26, 07:06 p. m.	Compra	69.94 USDT	Bs.S 853	Bs.S 59.659	PagoMovil	COMPLETED
26/07/26, 07:05 p. m.	Compra	87.45 USDT	Bs.S 853	Bs.S 74.600	Provincial	COMPLETED
26/07/26, 07:04 p. m.	Compra	59.94 USDT	Bs.S 853	Bs.S 51.129	BNCBancoNacional	COMPLETED
26/07/26, 07:03 p. m.	Compra	73.85 USDT	Bs.S 853	Bs.S 63.000	PagoMovil	COMPLETED
26/07/26, 07:02 p. m.	Compra	99.94 USDT	Bs.S 853	Bs.S 85.249	PagoMovil	COMPLETED
26/07/26, 06:56 p. m.	Compra	58.64 USDT	Bs.S 853	Bs.S 50.000	BNCBancoNacional	COMPLETED
26/07/26, 06:55 p. m.	Compra	71.52 USDT	Bs.S 853	Bs.S 60.975	Provincial	COMPLETED
26/07/26, 06:53 p. m.	Compra	59.94 USDT	Bs.S 853	Bs.S 51.102	PagoMovil	COMPLETED
26/07/26, 06:49 p. m.	Compra	189.62 USDT	Bs.S 853	Bs.S 161.662	PagoMovil	COMPLETED
26/07/26, 06:48 p. m.	Compra	58.64 USDT	Bs.S 853	Bs.S 50.000	PagoMovil	COMPLETED
26/07/26, 06:46 p. m.	Compra	58.64 USDT	Bs.S 853	Bs.S 50.000	PagoMovil	COMPLETED
26/07/26, 06:44 p. m.	Compra	69.94 USDT	Bs.S 853	Bs.S 59.628	PagoMovil	COMPLETED
26/07/26, 06:44 p. m.	Compra	64.51 USDT	Bs.S 853	Bs.S 55.000	PagoMovil	COMPLETED
26/07/26, 06:43 p. m.	Compra	58.64 USDT	Bs.S 853	Bs.S 50.000	PagoMovil	COMPLETED
26/07/26, 06:42 p. m.	Compra	59.94 USDT	Bs.S 853	Bs.S 51.102	PagoMovil	COMPLETED
26/07/26, 06:26 p. m.	Compra	99.80 USDT	Bs.S 853	Bs.S 85.129	PagoMovil	COMPLETED
26/07/26, 06:26 p. m.	Compra	100.82 USDT	Bs.S 853	Bs.S 86.000	PagoMovil	COMPLETED
26/07/26, 06:19 p. m.	Compra	69.28 USDT	Bs.S 852	Bs.S 59.030	PagoMovil	COMPLETED
26/07/26, 06:19 p. m.	Compra	69.94 USDT	Bs.S 852	Bs.S 59.589	PagoMovil	COMPLETED
26/07/26, 06:19 p. m.	Compra	82.15 USDT	Bs.S 852	Bs.S 70.000	PagoMovil	COMPLETED
26/07/26, 06:18 p. m.	Compra	58.68 USDT	Bs.S 852	Bs.S 50.000	PagoMovil	COMPLETED
26/07/26, 06:18 p. m.	Compra	99.80 USDT	Bs.S 852	Bs.S 85.030	PagoMovil	COMPLETED
26/07/26, 06:16 p. m.	Compra	99.80 USDT	Bs.S 851	Bs.S 84.930	PagoMovil	COMPLETED
26/07/26, 06:11 p. m.	Compra	79.84 USDT	Bs.S 851	Bs.S 67.944	PagoMovil	COMPLETED
26/07/26, 06:04 p. m.	Compra	99.80 USDT	Bs.S 851	Bs.S 84.930	PagoMovil	COMPLETED
26/07/26, 06:02 p. m.	Compra	62.15 USDT	Bs.S 851	Bs.S 52.897	PagoMovil	COMPLETED
26/07/26, 06:00 p. m.	Compra	64.77 USDT	Bs.S 851	Bs.S 55.125	PagoMovil	COMPLETED
26/07/26, 06:00 p. m.	Compra	79.50 USDT	Bs.S 851	Bs.S 67.655	PagoMovil	COMPLETED
26/07/26, 05:58 p. m.	Compra	99.94 USDT	Bs.S 851	Bs.S 85.049	PagoMovil	COMPLETED
26/07/26, 05:58 p. m.	Compra	98.81 USDT	Bs.S 851	Bs.S 84.087	PagoMovil	COMPLETED
26/07/26, 05:57 p. m.	Compra	99.94 USDT	Bs.S 851	Bs.S 85.049	PagoMovil	COMPLETED
26/07/26, 05:57 p. m.	Compra	99.80 USDT	Bs.S 851	Bs.S 84.930	PagoMovil	COMPLETED
26/07/26, 05:55 p. m.	Compra	69.33 USDT	Bs.S 851	Bs.S 59.000	PagoMovil	COMPLETED
26/07/26, 05:54 p. m.	Compra	59.94 USDT	Bs.S 851	Bs.S 51.009	PagoMovil	COMPLETED
26/07/26, 05:51 p. m.	Compra	99.80 USDT	Bs.S 851	Bs.S 84.891	PagoMovil	COMPLETED
26/07/26, 05:50 p. m.	Compra	117.56 USDT	Bs.S 851	Bs.S 100.000	PagoMovil	COMPLETED
26/07/26, 05:47 p. m.	Compra	60.55 USDT	Bs.S 851	Bs.S 51.500	PagoMovil	COMPLETED
26/07/26, 05:44 p. m.	Compra	74.10 USDT	Bs.S 850	Bs.S 63.000	BNCBancoNacional	COMPLETED
26/07/26, 05:42 p. m.	Compra	77.94 USDT	Bs.S 850	Bs.S 66.258	BNCBancoNacional	COMPLETED
26/07/26, 05:35 p. m.	Compra	187.64 USDT	Bs.S 853	Bs.S 160.000	Provincial	COMPLETED
26/07/26, 05:34 p. m.	Compra	114.77 USDT	Bs.S 853	Bs.S 97.861	PagoMovil	COMPLETED
26/07/26, 05:33 p. m.	Compra	70.36 USDT	Bs.S 853	Bs.S 60.000	PagoMovil	COMPLETED
26/07/26, 05:19 p. m.	Compra	70.56 USDT	Bs.S 850	Bs.S 60.000	BNCBancoNacional	COMPLETED
26/07/26, 05:06 p. m.	Compra	127.75 USDT	Bs.S 851	Bs.S 108.715	PagoMovil	COMPLETED
26/07/26, 05:05 p. m.	Compra	99.80 USDT	Bs.S 851	Bs.S 84.930	PagoMovil	COMPLETED
26/07/26, 05:02 p. m.	Compra	69.86 USDT	Bs.S 852	Bs.S 59.529	PagoMovil	COMPLETED
26/07/26, 04:59 p. m.	Compra	99.80 USDT	Bs.S 852	Bs.S 85.042	PagoMovil	COMPLETED
26/07/26, 04:58 p. m.	Compra	249.50 USDT	Bs.S 852	Bs.S 212.604	PagoMovil	COMPLETED
26/07/26, 04:58 p. m.	Compra	99.80 USDT	Bs.S 852	Bs.S 85.042	PagoMovil	COMPLETED
26/07/26, 03:23 p. m.	Compra	58.54 USDT	Bs.S 854	Bs.S 50.000	BNCBancoNacional	COMPLETED
26/07/26, 03:05 p. m.	Compra	59.94 USDT	Bs.S 854	Bs.S 51.189	PagoMovil	COMPLETED
26/07/26, 12:22 p. m.	Venta	57.41 USDT	Bs.S 871	Bs.S 50.000	PagoMovil	COMPLETED
26/07/26, 12:06 p. m.	Venta	68.90 USDT	Bs.S 871	Bs.S 60.000	Provincial	COMPLETED
26/07/26, 11:50 a. m.	Venta	172.25 USDT	Bs.S 871	Bs.S 150.000	Provincial	CANCELLED_BY_SYSTEM
26/07/26, 11:41 a. m.	Venta	100.06 USDT	Bs.S 871	Bs.S 87.132	Provincial	CANCELLED
26/07/26, 11:41 a. m.	Venta	75.06 USDT	Bs.S 871	Bs.S 65.362	PagoMovil	COMPLETED
26/07/26, 11:35 a. m.	Venta	60.17 USDT	Bs.S 871	Bs.S 52.400	PagoMovil	COMPLETED
26/07/26, 11:35 a. m.	Venta	60.06 USDT	Bs.S 871	Bs.S 52.300	PagoMovil	COMPLETED
26/07/26, 11:27 a. m.	Venta	344.51 USDT	Bs.S 871	Bs.S 300.000	Provincial	COMPLETED
26/07/26, 11:19 a. m.	Venta	86.12 USDT	Bs.S 871	Bs.S 75.000	Provincial	COMPLETED
26/07/26, 11:16 a. m.	Venta	99.42 USDT	Bs.S 871	Bs.S 86.576	Provincial	COMPLETED
26/07/26, 11:15 a. m.	Venta	89.57 USDT	Bs.S 871	Bs.S 78.000	PagoMovil	COMPLETED
26/07/26, 10:58 a. m.	Venta	1167.94 USDT	Bs.S 865	Bs.S 1.010.268	Mercantil	COMPLETED
26/07/26, 10:57 a. m.	Venta	999.94 USDT	Bs.S 865	Bs.S 864.959	BNCBancoNacional	COMPLETED
25/07/26, 06:39 p. m.	Compra	104.94 USDT	Bs.S 857	Bs.S 89.881	PagoMovil	COMPLETED
25/07/26, 06:39 p. m.	Compra	99.94 USDT	Bs.S 857	Bs.S 85.599	PagoMovil	COMPLETED
25/07/26, 06:38 p. m.	Compra	68.03 USDT	Bs.S 857	Bs.S 58.275	PagoMovil	COMPLETED
25/07/26, 06:38 p. m.	Compra	58.37 USDT	Bs.S 857	Bs.S 50.000	PagoMovil	COMPLETED
25/07/26, 06:36 p. m.	Compra	58.37 USDT	Bs.S 857	Bs.S 50.000	PagoMovil	COMPLETED
25/07/26, 06:36 p. m.	Compra	64.79 USDT	Bs.S 857	Bs.S 55.500	BNCBancoNacional	COMPLETED
25/07/26, 06:36 p. m.	Compra	68.87 USDT	Bs.S 857	Bs.S 58.987	Provincial	COMPLETED
25/07/26, 06:30 p. m.	Compra	89.82 USDT	Bs.S 857	Bs.S 76.950	Provincial	COMPLETED
25/07/26, 06:29 p. m.	Compra	81.84 USDT	Bs.S 857	Bs.S 70.113	PagoMovil	COMPLETED
25/07/26, 06:29 p. m.	Compra	299.40 USDT	Bs.S 857	Bs.S 256.499	Provincial	COMPLETED
25/07/26, 06:22 p. m.	Compra	68.86 USDT	Bs.S 857	Bs.S 59.000	PagoMovil	COMPLETED
25/07/26, 06:21 p. m.	Compra	67.94 USDT	Bs.S 857	Bs.S 58.205	PagoMovil	COMPLETED
25/07/26, 06:17 p. m.	Compra	99.80 USDT	Bs.S 860	Bs.S 85.804	PagoMovil	COMPLETED
25/07/26, 06:17 p. m.	Compra	281.44 USDT	Bs.S 860	Bs.S 241.971	PagoMovil	COMPLETED
25/07/26, 06:16 p. m.	Compra	94.81 USDT	Bs.S 860	Bs.S 81.514	PagoMovil	COMPLETED
25/07/26, 06:03 p. m.	Compra	59.94 USDT	Bs.S 861	Bs.S 51.588	PagoMovil	COMPLETED
25/07/26, 05:51 p. m.	Compra	73.94 USDT	Bs.S 860	Bs.S 63.589	PagoMovil	COMPLETED
25/07/26, 05:50 p. m.	Compra	299.94 USDT	Bs.S 860	Bs.S 257.949	BNCBancoNacional	COMPLETED
25/07/26, 05:01 p. m.	Venta	57.20 USDT	Bs.S 874	Bs.S 50.000	Bancaribe	CANCELLED
25/07/26, 04:30 p. m.	Venta	100.06 USDT	Bs.S 874	Bs.S 87.452	PagoMovil	COMPLETED
25/07/26, 03:57 p. m.	Venta	71.06 USDT	Bs.S 874	Bs.S 62.106	PagoMovil	COMPLETED
25/07/26, 03:57 p. m.	Venta	86.95 USDT	Bs.S 874	Bs.S 76.000	PagoMovil	COMPLETED
25/07/26, 03:57 p. m.	Venta	65.21 USDT	Bs.S 874	Bs.S 57.000	PagoMovil	COMPLETED
25/07/26, 02:39 p. m.	Venta	114.16 USDT	Bs.S 876	Bs.S 100.000	PagoMovil	COMPLETED
25/07/26, 02:30 p. m.	Venta	57.15 USDT	Bs.S 875	Bs.S 50.000	PagoMovil	COMPLETED
25/07/26, 02:29 p. m.	Venta	62.87 USDT	Bs.S 875	Bs.S 55.000	PagoMovil	COMPLETED
25/07/26, 02:15 p. m.	Venta	70.14 USDT	Bs.S 877	Bs.S 61.506	PagoMovil	CANCELLED
25/07/26, 02:08 p. m.	Venta	95.19 USDT	Bs.S 877	Bs.S 83.472	PagoMovil	COMPLETED
25/07/26, 01:53 p. m.	Venta	56.97 USDT	Bs.S 878	Bs.S 50.000	PagoMovil	COMPLETED
25/07/26, 01:41 p. m.	Venta	84.25 USDT	Bs.S 876	Bs.S 73.800	PagoMovil	COMPLETED
25/07/26, 01:32 p. m.	Venta	99.89 USDT	Bs.S 876	Bs.S 87.500	PagoMovil	COMPLETED
25/07/26, 01:26 p. m.	Venta	85.16 USDT	Bs.S 876	Bs.S 74.600	PagoMovil	CANCELLED
25/07/26, 01:26 p. m.	Venta	124.44 USDT	Bs.S 876	Bs.S 109.000	PagoMovil	COMPLETED
25/07/26, 01:23 p. m.	Venta	100.46 USDT	Bs.S 876	Bs.S 88.000	PagoMovil	CANCELLED
25/07/26, 01:23 p. m.	Venta	100.46 USDT	Bs.S 876	Bs.S 88.000	PagoMovil	COMPLETED
25/07/26, 01:23 p. m.	Venta	200.40 USDT	Bs.S 876	Bs.S 175.530	PagoMovil	COMPLETED
25/07/26, 01:22 p. m.	Venta	70.78 USDT	Bs.S 876	Bs.S 62.000	PagoMovil	COMPLETED
25/07/26, 01:21 p. m.	Venta	63.93 USDT	Bs.S 876	Bs.S 56.000	PagoMovil	COMPLETED
25/07/26, 01:19 p. m.	Venta	57.08 USDT	Bs.S 876	Bs.S 50.000	PagoMovil	COMPLETED
25/07/26, 01:17 p. m.	Venta	93.61 USDT	Bs.S 876	Bs.S 82.000	PagoMovil	COMPLETED
25/07/26, 01:12 p. m.	Venta	67.90 USDT	Bs.S 876	Bs.S 59.479	PagoMovil	CANCELLED_BY_SYSTEM
25/07/26, 01:07 p. m.	Venta	79.41 USDT	Bs.S 875	Bs.S 69.457	PagoMovil	COMPLETED
25/07/26, 01:04 p. m.	Venta	100.20 USDT	Bs.S 875	Bs.S 87.635	PagoMovil	COMPLETED
25/07/26, 01:03 p. m.	Venta	57.16 USDT	Bs.S 875	Bs.S 50.000	PagoMovil	COMPLETED
25/07/26, 01:02 p. m.	Venta	108.62 USDT	Bs.S 875	Bs.S 95.000	PagoMovil	COMPLETED
25/07/26, 12:46 p. m.	Venta	66.29 USDT	Bs.S 875	Bs.S 58.000	PagoMovil	COMPLETED
25/07/26, 12:37 p. m.	Venta	70.29 USDT	Bs.S 875	Bs.S 61.500	PagoMovil	COMPLETED
25/07/26, 12:35 p. m.	Venta	65.78 USDT	Bs.S 875	Bs.S 57.551	BNCBancoNacional	COMPLETED
25/07/26, 12:34 p. m.	Venta	80.10 USDT	Bs.S 874	Bs.S 70.000	PagoMovil	COMPLETED
25/07/26, 12:33 p. m.	Venta	77.81 USDT	Bs.S 874	Bs.S 68.000	PagoMovil	COMPLETED
25/07/26, 12:24 p. m.	Venta	114.42 USDT	Bs.S 874	Bs.S 100.000	PagoMovil	COMPLETED
25/07/26, 12:18 p. m.	Venta	120.24 USDT	Bs.S 875	Bs.S 105.198	PagoMovil	COMPLETED
25/07/26, 12:13 p. m.	Venta	99.32 USDT	Bs.S 876	Bs.S 87.000	PagoMovil	CANCELLED
25/07/26, 11:44 a. m.	Venta	114.06 USDT	Bs.S 877	Bs.S 100.000	PagoMovil	COMPLETED
25/07/26, 11:29 a. m.	Venta	91.25 USDT	Bs.S 877	Bs.S 80.000	PagoMovil	CANCELLED_BY_SYSTEM
25/07/26, 11:28 a. m.	Venta	102.65 USDT	Bs.S 877	Bs.S 90.000	PagoMovil	COMPLETED
25/07/26, 11:26 a. m.	Venta	299.72 USDT	Bs.S 876	Bs.S 262.500	PagoMovil	COMPLETED
25/07/26, 11:22 a. m.	Venta	85.63 USDT	Bs.S 876	Bs.S 75.000	PagoMovil	COMPLETED
25/07/26, 11:20 a. m.	Venta	300.60 USDT	Bs.S 875	Bs.S 262.935	PagoMovil	COMPLETED
25/07/26, 11:20 a. m.	Venta	78.65 USDT	Bs.S 875	Bs.S 68.800	PagoMovil	COMPLETED
25/07/26, 11:20 a. m.	Venta	87.45 USDT	Bs.S 875	Bs.S 76.500	PagoMovil	CANCELLED
25/07/26, 10:43 a. m.	Venta	300.44 USDT	Bs.S 877	Bs.S 263.400	Banesco	COMPLETED
25/07/26, 10:27 a. m.	Venta	68.34 USDT	Bs.S 878	Bs.S 60.000	banesco	COMPLETED
25/07/26, 10:10 a. m.	Venta	456.15 USDT	Bs.S 877	Bs.S 400.000	banesco	COMPLETED
25/07/26, 10:09 a. m.	Venta	1145.80 USDT	Bs.S 873	Bs.S 1.000.000	BancoDeVenezuela	COMPLETED
24/07/26, 09:39 p. m.	Compra	67.94 USDT	Bs.S 864	Bs.S 58.714	PagoMovil	COMPLETED
24/07/26, 09:38 p. m.	Compra	68.30 USDT	Bs.S 864	Bs.S 59.030	PagoMovil	COMPLETED
24/07/26, 09:35 p. m.	Compra	109.94 USDT	Bs.S 864	Bs.S 95.010	PagoMovil	COMPLETED
24/07/26, 09:32 p. m.	Compra	59.94 USDT	Bs.S 864	Bs.S 51.800	PagoMovil	COMPLETED
24/07/26, 09:30 p. m.	Compra	57.85 USDT	Bs.S 864	Bs.S 50.000	PagoMovil	COMPLETED
24/07/26, 09:29 p. m.	Compra	59.94 USDT	Bs.S 864	Bs.S 51.800	PagoMovil	COMPLETED
24/07/26, 09:25 p. m.	Compra	99.80 USDT	Bs.S 866	Bs.S 86.429	PagoMovil	COMPLETED
24/07/26, 09:25 p. m.	Compra	57.73 USDT	Bs.S 866	Bs.S 50.000	PagoMovil	COMPLETED
24/07/26, 09:17 p. m.	Compra	74.96 USDT	Bs.S 867	Bs.S 65.000	PagoMovil	COMPLETED
24/07/26, 09:16 p. m.	Compra	59.94 USDT	Bs.S 867	Bs.S 51.975	PagoMovil	COMPLETED
24/07/26, 09:13 p. m.	Compra	69.19 USDT	Bs.S 867	Bs.S 60.000	PagoMovil	COMPLETED
24/07/26, 09:13 p. m.	Compra	76.69 USDT	Bs.S 867	Bs.S 66.500	PagoMovil	COMPLETED
24/07/26, 08:51 p. m.	Compra	92.47 USDT	Bs.S 865	Bs.S 80.000	PagoMovil	COMPLETED
24/07/26, 08:41 p. m.	Compra	99.94 USDT	Bs.S 865	Bs.S 86.459	PagoMovil	COMPLETED
24/07/26, 08:21 p. m.	Compra	99.94 USDT	Bs.S 864	Bs.S 86.318	PagoMovil	COMPLETED
24/07/26, 08:20 p. m.	Compra	79.94 USDT	Bs.S 864	Bs.S 69.044	PagoMovil	COMPLETED
24/07/26, 08:18 p. m.	Compra	93.20 USDT	Bs.S 864	Bs.S 80.500	PagoMovil	COMPLETED
24/07/26, 08:09 p. m.	Compra	67.14 USDT	Bs.S 864	Bs.S 58.000	PagoMovil	COMPLETED
24/07/26, 08:08 p. m.	Compra	82.58 USDT	Bs.S 864	Bs.S 71.338	PagoMovil	COMPLETED
24/07/26, 08:06 p. m.	Compra	79.84 USDT	Bs.S 864	Bs.S 68.963	PagoMovil	COMPLETED
24/07/26, 07:54 p. m.	Compra	149.70 USDT	Bs.S 866	Bs.S 129.580	PagoMovil	COMPLETED
24/07/26, 07:54 p. m.	Compra	249.50 USDT	Bs.S 866	Bs.S 215.967	PagoMovil	COMPLETED
24/07/26, 07:52 p. m.	Compra	99.80 USDT	Bs.S 866	Bs.S 86.387	PagoMovil	COMPLETED
24/07/26, 07:49 p. m.	Compra	60.20 USDT	Bs.S 866	Bs.S 52.109	PagoMovil	COMPLETED
24/07/26, 12:01 p. m.	Venta	150.06 USDT	Bs.S 874	Bs.S 131.137	Bancamiga	COMPLETED
24/07/26, 11:59 a. m.	Venta	70.94 USDT	Bs.S 874	Bs.S 62.000	PagoMovil	COMPLETED
24/07/26, 11:58 a. m.	Venta	75.06 USDT	Bs.S 874	Bs.S 65.595	Bancamiga	COMPLETED
24/07/26, 11:56 a. m.	Venta	68.65 USDT	Bs.S 874	Bs.S 60.000	PagoMovil	COMPLETED
24/07/26, 11:54 a. m.	Venta	60.64 USDT	Bs.S 874	Bs.S 53.000	PagoMovil	COMPLETED
24/07/26, 11:49 a. m.	Venta	75.52 USDT	Bs.S 874	Bs.S 66.000	PagoMovil	COMPLETED
24/07/26, 11:48 a. m.	Venta	446.27 USDT	Bs.S 874	Bs.S 390.000	Bancamiga	COMPLETED
24/07/26, 11:25 a. m.	Venta	100.06 USDT	Bs.S 874	Bs.S 87.442	PagoMovil	COMPLETED
24/07/26, 11:25 a. m.	Venta	102.26 USDT	Bs.S 874	Bs.S 89.365	Provincial	COMPLETED
24/07/26, 11:21 a. m.	Venta	68.59 USDT	Bs.S 875	Bs.S 60.000	PagoMovil	COMPLETED
24/07/26, 11:09 a. m.	Venta	56.95 USDT	Bs.S 878	Bs.S 50.000	Provincial	COMPLETED
24/07/26, 10:50 a. m.	Venta	180.77 USDT	Bs.S 878	Bs.S 158.700	Provincial	COMPLETED
24/07/26, 10:29 a. m.	Venta	341.37 USDT	Bs.S 879	Bs.S 300.000	Provincial	COMPLETED
24/07/26, 10:20 a. m.	Venta	97.40 USDT	Bs.S 878	Bs.S 85.500	Provincial	COMPLETED
24/07/26, 10:15 a. m.	Venta	58.26 USDT	Bs.S 875	Bs.S 51.000	PagoMovil	COMPLETED
24/07/26, 10:15 a. m.	Venta	57.12 USDT	Bs.S 875	Bs.S 50.000	PagoMovil	COMPLETED
24/07/26, 10:13 a. m.	Venta	62.64 USDT	Bs.S 875	Bs.S 54.835	PagoMovil	COMPLETED
24/07/26, 10:13 a. m.	Venta	101.67 USDT	Bs.S 875	Bs.S 89.000	PagoMovil	COMPLETED
24/07/26, 10:13 a. m.	Venta	62.60 USDT	Bs.S 875	Bs.S 54.800	PagoMovil	COMPLETED
24/07/26, 10:13 a. m.	Venta	59.40 USDT	Bs.S 875	Bs.S 52.000	PagoMovil	COMPLETED
24/07/26, 10:12 a. m.	Venta	57.12 USDT	Bs.S 875	Bs.S 50.000	PagoMovil	COMPLETED
24/07/26, 10:12 a. m.	Venta	81.16 USDT	Bs.S 850	Bs.S 71.039	PagoMovil	CANCELLED
24/07/26, 10:10 a. m.	Venta	1145.08 USDT	Bs.S 873	Bs.S 1.000.000	BancoDeVenezuela	COMPLETED
24/07/26, 09:47 a. m.	Venta	150.06 USDT	Bs.S 878	Bs.S 131.738	PagoMovil	COMPLETED
24/07/26, 09:34 a. m.	Venta	56.95 USDT	Bs.S 878	Bs.S 50.000	PagoMovil	COMPLETED
24/07/26, 09:32 a. m.	Venta	100.20 USDT	Bs.S 878	Bs.S 87.966	PagoMovil	COMPLETED
24/07/26, 09:27 a. m.	Venta	455.63 USDT	Bs.S 878	Bs.S 400.000	PagoMovil	CANCELLED
24/07/26, 09:27 a. m.	Venta	79.73 USDT	Bs.S 878	Bs.S 70.000	PagoMovil	COMPLETED
24/07/26, 09:24 a. m.	Venta	105.21 USDT	Bs.S 878	Bs.S 92.364	PagoMovil	COMPLETED
24/07/26, 09:15 a. m.	Venta	1154.94 USDT	Bs.S 875	Bs.S 1.010.573	BDDT	COMPLETED
24/07/26, 09:15 a. m.	Venta	10.22 USDT	Bs.S 880	Bs.S 9.000	BancoDeVenezuela	COMPLETED
23/07/26, 05:20 p. m.	Venta	43.38 USDT	Bs.S 876	Bs.S 38.000	BancoDeVenezuela	COMPLETED
23/07/26, 05:20 p. m.	Venta	8.44 USDT	Bs.S 876	Bs.S 7.400	BancoDeVenezuela	COMPLETED
23/07/26, 05:18 p. m.	Venta	10.27 USDT	Bs.S 876	Bs.S 9.000	BancoDeVenezuela	COMPLETED
23/07/26, 05:18 p. m.	Venta	7.99 USDT	Bs.S 876	Bs.S 7.000	PagoMovil	COMPLETED
"""

def parse_bs(s: str) -> float:
    s = s.replace('Bs.S', '').strip()
    parts = s.split('.')
    if len(parts) == 1:
        return float(parts[0])
    if len(parts[-1]) == 3:
        return float(''.join(parts))
    return float(''.join(parts[:-1]) + '.' + parts[-1])

pat = re.compile(
    r'(\d{2}/\d{2}/\d{2}).*?\t(Compra|Venta)\t([\d.]+)\s*USDT\tBs\.S\s*([\d.]+)\tBs\.S\s*([\d.]+)\t.*?\t([A-Z_]+)'
)

rows = []
for line in RAW.strip().splitlines():
    line = line.strip()
    if not line:
        continue
    m = pat.search(line)
    if not m:
        print('UNPARSED:', line[:100])
        continue
    date, typ, usdt, price, total, status = m.groups()
    rows.append({
        'date': date, 'type': typ, 'usdt': float(usdt),
        'price': float(price), 'total': parse_bs(total), 'status': status,
    })

ok = [r for r in rows if r['status'] == 'COMPLETED']
pending = [r for r in rows if r['status'] == 'BUYER_PAYED']
print(f'Parseadas: {len(rows)} | COMPLETED: {len(ok)} | BUYER_PAYED: {len(pending)} | otras: {len(rows)-len(ok)-len(pending)}')

by_day = defaultdict(lambda: {'buy_u':0,'buy_bs':0,'buy_n':0,'sell_u':0,'sell_bs':0,'sell_n':0})
tot_buy_u=tot_buy_bs=tot_sell_u=tot_sell_bs=0.0
n_buy=n_sell=0
for r in ok:
    d=by_day[r['date']]
    if r['type']=='Compra':
        d['buy_u']+=r['usdt']; d['buy_bs']+=r['total']; d['buy_n']+=1
        tot_buy_u+=r['usdt']; tot_buy_bs+=r['total']; n_buy+=1
    else:
        d['sell_u']+=r['usdt']; d['sell_bs']+=r['total']; d['sell_n']+=1
        tot_sell_u+=r['usdt']; tot_sell_bs+=r['total']; n_sell+=1

def fmt(n): return f'{n:,.0f}'.replace(',', '.')
def f2(n): return f'{n:,.2f}'.replace(',', 'X').replace('.', ',').replace('X', '.')

print('\n=== POR DIA (COMPLETED) ===')
for d in sorted(by_day.keys(), key=lambda x: (x[6:8], x[3:5], x[0:2])):
    x=by_day[d]
    print(f"{d}: COMPRAS {x['buy_n']:3d} | {x['buy_u']:10.2f} USDT | Bs {fmt(x['buy_bs']):>12}")
    print(f"         VENTAS  {x['sell_n']:3d} | {x['sell_u']:10.2f} USDT | Bs {fmt(x['sell_bs']):>12}")
    print(f"         Neto (compra-venta): {x['buy_u']-x['sell_u']:+.2f} USDT")

print('\n=== TOTAL (23–27 jul) ===')
print(f'Compras: {n_buy} ops | {tot_buy_u:.2f} USDT | Bs {fmt(tot_buy_bs)} | media {tot_buy_bs/tot_buy_u:.2f}')
print(f'Ventas:  {n_sell} ops | {tot_sell_u:.2f} USDT | Bs {fmt(tot_sell_bs)} | media {tot_sell_bs/tot_sell_u:.2f}')
net = tot_buy_u - tot_sell_u
print(f'Neto USDT (compras - ventas): {net:+.2f}')
if net < 0:
    print(f'FALTA POR COMPRAR: {abs(net):.2f} USDT')
else:
    print(f'SOBRANTE (compraste de mas): {net:.2f} USDT')

matched = min(tot_buy_u, tot_sell_u)
avg_b = tot_buy_bs/tot_buy_u
avg_s = tot_sell_bs/tot_sell_u
spread = avg_s - avg_b
profit = matched * spread
print('\n=== RENTABILIDAD ===')
print(f'Spread: {spread:.2f} Bs/USDT')
print(f'Ganancia est. matched: Bs {fmt(profit)} (~{profit/avg_b:.2f} USDT) | ROI {100*profit/(matched*avg_b):.2f}%')

pend_u = sum(r['usdt'] for r in pending)
print(f'\nBUYER_PAYED (aún no COMPLETED): {pend_u:.2f} USDT')
if net < 0:
    print(f'Si se completa esa compra pendiente, falta quedaría en: {abs(net)-pend_u:.2f} USDT')
