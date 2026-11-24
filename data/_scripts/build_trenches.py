import json,sys,math
steps={int(f['properties']['SEQNUM']):f['properties'] for f in json.load(open(sys.argv[1]))['features']}
def chain(seqs):
    """seqs: list of (seq, reversed?) -> ordered list of (lat,lon)"""
    pts=[]
    for s,rev in seqs:
        p=steps[s]; a=(p['STARTLAT'],p['STARTLONG']); b=(p['FINALLAT'],p['FINALLONG'])
        if rev: a,b=b,a
        if not pts: pts.append(a)
        assert abs(pts[-1][0]-a[0])<1e-3 and abs(pts[-1][1]-a[1])<1e-3,(s,pts[-1],a)
        pts.append(b)
    return pts
def hav(a,b):
    R=6371.0;p1,p2=math.radians(a[0]),math.radians(b[0]);dl=math.radians(b[1]-a[1]);dp=p2-p1
    return 2*R*math.asin(math.sqrt(math.sin(dp/2)**2+math.cos(p1)*math.cos(p2)*math.sin(dl/2)**2))
def bearing(a,b):
    p1,p2=math.radians(a[0]),math.radians(b[0]);dl=math.radians(b[1]-a[1])
    return math.degrees(math.atan2(math.sin(dl)*math.cos(p2),math.cos(p1)*math.sin(p2)-math.sin(p1)*math.cos(p2)*math.cos(dl)))%360
def simplify(pts,mn=50.0):
    out=[pts[0]]
    for p in pts[1:-1]:
        if hav(out[-1],p)>=mn: out.append(p)
    if hav(out[-1],pts[-1])<mn*0.5 and len(out)>1: out[-1]=pts[-1]   # ponytail: merge tiny tail into end point
    else: out.append(pts[-1])
    return out
def azimuths(pts,ocean):
    az=[]
    for i in range(len(pts)):
        a=pts[max(i-1,0)]; b=pts[min(i+1,len(pts)-1)]
        st=bearing(a,b)
        n=[(st+90)%360,(st-90)%360]
        diff=lambda x:abs((x-ocean+180)%360-180)
        az.append(round(min(n,key=diff)))
    return az
def r3(p): return [round(p[0],3),round(p[1],3)]

# Sunda: Java (112.5E) NW to SU-BU-AU junction 1.345N 96.202E. Steps 1390..1375 then 3768..3750, all reversed.
sunda=chain([(s,True) for s in range(1390,1374,-1)]+[(s,True) for s in range(3768,3749,-1)])
# clip first point (112.563E) to 112.5E by linear interpolation along PB2002 step 1390
(a,b)=sunda[0],sunda[1]; t=(112.5-b[1])/(a[1]-b[1]); sunda[0]=(b[0]+t*(a[0]-b[0]),112.5)
# Andaman-Nicobar: junction 1.345N 96.202E north: BU/AU 3749..3747, BU/IN 3746..3739 (reversed), IN\BU 4152..4163, IN-BU OCB 4164
anda=chain([(s,True) for s in range(3749,3746,-1)]+[(s,True) for s in range(3746,3738,-1)]+[(s,False) for s in range(4152,4165)])
# Makran: AR-EU OCB 1346..1337 traced W->E (as in source, reversed), 57.83E to 65.03E
mak=chain([(s,True) for s in range(1346,1336,-1)])

defs=[
 ("Sunda (Java-Sumatra)",sunda,"SW",225,"PB2002 STEPCLASS=SUB, boundary SU/AU (Australia plate subducts beneath Sunda plate), steps 1375-1390 and 3750-3768. Ordered from 112.5E off Java NW to the PB2002 SU-BU-AU triple junction at 1.345N 96.202E (west of Sumatra). First point is linearly interpolated along PB2002 step 1390 to clip at 112.5E; all other points are PB2002 step endpoints."),
 ("Andaman-Nicobar",anda,"W",270,"PB2002 STEPCLASS=SUB for boundaries BU/AU, BU/IN and IN\BU (steps 3739-3749, 4152-4163), plus one IN-BU step classed OCB (oceanic convergent boundary, step 4164) ending at 14.384N 92.517E. North of that PB2002 turns the boundary into continental transform faults (CTF) running NE onshore Myanmar, so PB2002 gives no subduction trace for 15-18N. Starts at the SU-BU-AU junction shared with the Sunda polyline."),
 ("Makran",mak,"S",180,"PB2002 does NOT class Makran as SUB; it is boundary AR-EU with STEPCLASS=OCB (oceanic convergent boundary), steps 1337-1346, from 57.832E to 65.028E at 24.1-24.4N. Ordered W->E. East of 65.03E the boundary becomes EU-IN (Ornach-Nal/Chaman, continental) and west of 57.8E it turns north into the Strait of Hormuz/Zagros (CCB), so both were excluded."),
]
out={"source":"Bird, P. (2003), An updated digital model of plate boundaries, Geochem. Geophys. Geosyst., 4(3), 1027, doi:10.1029/2001GC000252 (PB2002), GeoJSON conversion PB2002_steps.json from github.com/fraxen/tectonicplates",
 "url":"https://raw.githubusercontent.com/fraxen/tectonicplates/master/GeoJSON/PB2002_steps.json",
 "rawFile":"data/_raw/pb2002_ndbc/PB2002_steps.json",
 "domain":{"latMin":-41,"latMax":41,"lonMin":22.5,"lonMax":112.5},
 "method":"PB2002 step endpoints (steps are 20-100 km long) chained in along-trench order, then thinned so consecutive kept points are >=50 km apart (first and last kept). oceanAzimuthDeg[i] is the derived local normal to the trench (from neighbouring points) pointing toward the downgoing (ocean) plate, i.e. the direction from the overriding plate toward the trench; degrees clockwise from north.",
 "excluded":"The Hellenic/Cyprus arcs (PB2002 AS/AF and AT/AF SUB, ~35N 22.9-34.5E) fall inside the box but are Mediterranean, not Indian Ocean, so they were left out.",
 "trenches":[]}
for name,pts,side,ocean,note in defs:
    sp=simplify(pts)
    gaps=[round(hav(sp[i],sp[i+1])) for i in range(len(sp)-1)]
    for p in sp: assert -41<=p[0]<=41 and 22.5<=p[1]<=112.5,(name,p)
    out["trenches"].append({"name":name,"points":[r3(p) for p in sp],"oceanSide":side,"oceanAzimuthDeg":azimuths(sp,ocean),"spacingKm":{"min":min(gaps),"max":max(gaps)},"note":note})
    print(name,len(pts),"->",len(sp),"gaps",min(gaps),max(gaps))
json.dump(out,open(sys.argv[2],'w'),indent=1)
