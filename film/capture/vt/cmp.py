import subprocess, numpy as np
from scipy.signal import stft
def spec(f):
    raw = subprocess.run(["ffmpeg","-v","error","-i",f,"-ac","1","-ar","16000","-f","s16le","-"],capture_output=True).stdout
    x = np.frombuffer(raw,np.int16).astype(np.float32)/32768
    nz = np.where(np.abs(x)>0.02)[0]; x = x[nz[0]:nz[-1]]
    _,_,Z = stft(x,16000,nperseg=400,noverlap=240)
    S = np.log(np.abs(Z[:200])+1e-4); return (S - S.mean(1,keepdims=True)).T
def dtw(a,b):
    D = np.full((len(a)+1,len(b)+1),np.inf); D[0,0]=0
    C = ((a[:,None,:]-b[None,:,:])**2).sum(-1)**0.5
    for i in range(1,len(a)+1):
        for j in range(1,len(b)+1):
            D[i,j]=C[i-1,j-1]+min(D[i-1,j],D[i,j-1],D[i-1,j-1])
    return D[-1,-1]/(len(a)+len(b))
P="capture/vt/r_"
for cand in ["Lead_Time","LeadTime"]:
    c=spec(P+cand+".mp3"); print(cand,"vs Led",round(dtw(c,spec(P+"Led_Time.mp3")),3),"vs Leed",round(dtw(c,spec(P+"Leed_Time.mp3")),3))
for cand in ["live_in_your_browser","live__in_your_browser"]:
    c=spec(P+cand+".mp3"); print(cand,"vs liv",round(dtw(c,spec(P+"liv_in_your_browser.mp3")),3),"vs lyve",round(dtw(c,spec(P+"lyve_in_your_browser.mp3")),3))
