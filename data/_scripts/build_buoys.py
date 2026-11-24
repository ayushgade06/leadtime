import json,sys
NDBC="https://www.ndbc.noaa.gov/station_page.php?station="
ACT="NDBC activestations.xml (type=dart) + NDBC station page"
INC="INCOIS, India Sea Level Network report, GLOSS GE-18 (2025), Annexure-2; https://oceanexpert.net/downloadFile/58317"
IOC="IOC Sea Level Station Monitoring Facility station list; https://www.ioc-sealevelmonitoring.org/service.php?query=stationlist&showall=all"
# (id, name, operator, lat, lon, depthM, status, reportingRecently, extraSources, note)
rows=[
("23217","Bay of Bengal IN3 (INCOIS STB03)","INCOIS",3.798,91.701,4004,"active",False,[INC],"SAIC Tsunami Buoy (STB)."),
("23218","Bay of Bengal IN4 (NIOT ITB05)","NIOT (India)",10.165,88.5,3329,"active",True,[INC],"Indian indigenous tsunami buoy. INCOIS lists it as INCOIS-shared ITB05."),
("23219","Bay of Bengal","INCOIS",13.472,88.998,2942,"active",False,[INC,IOC],"Position matches INCOIS Annexure-2 ITB06 (13.5N 89.0E), but that report gives ITB06 the WMO ID 23220. SAIC STB."),
("23220","Bay of Bengal (NIOT, INCOIS-listed ITB06)","NIOT (India)",14.433,89.333,None,"active",True,[INC,IOC],"Not in activestations.xml, but the NDBC station page showed data on 2026-11-24 and INCOIS (2025) lists 23220 as a shared Indian buoy."),
("23223","Bay of Bengal (NIOT ITB09)","NIOT (India)",17.333,89.483,None,"active",True,[INC],"INCOIS Annexure-2 gives ITB09 as 17.7N 89.6E (rounded, older position). The NDBC page gives no water depth."),
("23225","Arabian Sea","NIOT (India)",18.63,67.18,3269,"unknown",False,[IOC],"Not in NDBC activestations.xml and no recent data. IOC SLSMF code 'dasa' has status 5 (not reporting)."),
("23226","Arabian Sea (NIOT ITB12)","NIOT (India)",20.2,67.333,None,"active",False,[INC,IOC],"INCOIS Annexure-2 gives ITB12 as 19.9N 67.0E. The NDBC page gives no water depth."),
("23227","Bay of Bengal (INCOIS STB01)","INCOIS",6.265,88.653,3801,"active",False,[INC,IOC],"SAIC STB with DART II BPR. IOC lists a slightly different position, 6.2547N 88.7919E (code dni1/dni2)."),
("23228","Arabian Sea (INCOIS STB02)","INCOIS",20.764,65.284,2746,"active",False,[INC,IOC],"SAIC STB with DART II BPR. Faces the Makran subduction zone."),
("23401","BAY OF BENGAL - 600 NM WNW of Phuket, Thailand","Thailand (NDWC)",8.86,88.55,None,"active",True,[IOC],"DART II payload. The NDBC page gives no water depth."),
("23461","ANDAMAN SEA - 180 NM NW of Phuket, Thailand","Thailand (NDWC)",9.534,95.669,2500,"active",False,[IOC],"Listed as active by NDBC, but the NDBC page showed no recent data."),
("53401","Indonesia","Indonesia (BPPT)",0.05,91.899,4530,"historical",False,[IOC],"Not in NDBC activestations.xml. IOC SLSMF code 'dind' (operator ID 53401) last data 2008-03-31."),
("56001","Indian Ocean 1 - 1025km NW of Dampier","BoM",-14.046,110.028,5633,"active",True,[IOC],"DART II payload. IOC lists it at -13.9908, 110.097 (code djvw)."),
]
out={"retrieved":"2026-11-24","domain":{"latMin":-41,"latMax":41,"lonMin":22.5,"lonMax":112.5},
 "statusKey":"active = listed in NDBC activestations.xml (or reporting on its NDBC station page); historical = the source shows that data stopped; unknown = neither. reportingRecently = the NDBC station page showed water-column data dated 2026-11-24 when fetched.",
 "excluded":"56003 (BoM Indian Ocean 2, -15.019, 118.073) lies outside the lon domain. No confirmed coordinates were found for the Indonesian GITEWS or InaBuoy buoys.",
 "rawFiles":["data/_raw/pb2002_ndbc/activestations.xml","data/_raw/pb2002_ndbc/st_<id>.html","data/_raw/buoy_docs/incois_oe.pdf","data/_raw/ioc_slsmf/stationlist.json"],
 "buoys":[]}
for i,n,op,la,lo,dep,st,rec,ex,note in rows:
    assert -41<=la<=41 and 22.5<=lo<=112.5,i
    out["buoys"].append({"id":i,"name":n,"operator":op,"lat":la,"lon":lo,"depthM":dep,"status":st,"reportingRecently":rec,
        "source":"; ".join(([ACT] if st=="active" and i!="23220" else ["NDBC station page"])+ex),"url":NDBC+i,"note":note})
json.dump(out,open(sys.argv[1],'w'),indent=1)
print(len(out["buoys"]))
