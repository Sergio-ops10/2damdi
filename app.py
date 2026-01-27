from flask import Flask, jsonify, send_file
from flask_cors import CORS
import paramiko
import subprocess
import os
import time
import io

app = Flask(__name__)
CORS(app)

import platform
import sys

# --- CONFIGURACIÓN DE TUS SERVIDORES ---
SERVIDORES = [
    {"id": 1, "nombre": "server1", "ip": "192.168.0.42", "user": "root1", "pass": "root"},
    {"id": 2, "nombre": "server2", "ip": "192.168.0.43", "user": "root1", "pass": "root"}
]

# Detectar Sistema Operativo
if platform.system() == "Windows":
    VBOX_MANAGE_CMD = r"C:\Program Files\Oracle\VirtualBox\VBoxManage.exe"
else:
    # En Linux, suele estar en el PATH. Si falla, intenta "/usr/bin/VBoxManage"
    VBOX_MANAGE_CMD = "VBoxManage"

def ejecutar_comando_ssh(srv, comando, sudo=False):
    """Ejecuta comandos por SSH. Si sudo=True, maneja la contraseña."""
    try:
        ssh = paramiko.SSHClient()
        ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        ssh.connect(srv['ip'], username=srv['user'], password=srv['pass'], timeout=3)
        
        if sudo:
            comando = f"echo {srv['pass']} | sudo -S {comando}"
        
        stdin, stdout, stderr = ssh.exec_command(comando)
        # Forzar lectura para asegurar ejecución
        out = stdout.read().decode().strip()
        err = stderr.read().decode().strip()
        ssh.close()
        
        return out if out else (err if err else ""), True
    except Exception as e:
        return str(e), False

def encender_vm(nombre_vm):
    """Enciende una VM usando VBoxManage localmente."""
    try:
        # 'startvm' --type headless para que no abra ventana en el host si no se quiere
        # Usamos capture_output=True para obtener el mensaje de error real si falla
        res = subprocess.run(
            [VBOX_MANAGE_CMD, "startvm", nombre_vm, "--type", "headless"], 
            capture_output=True, 
            text=True
        )
        
        if res.returncode == 0:
            return True, "VM Iniciada correctamente"
        else:
            # Retornar el error de stderr (que dirá por qué falló)
            return False, f"Error VBox: {res.stderr.strip()}"
            
    except FileNotFoundError:
        return False, "VBoxManage no encontrado en el PATH"
    except Exception as e:
        return False, f"Error inesperado: {str(e)}"

def get_vm_screenshot_bytes(nombre_vm):
    """Toma un screenshot de la VM y devuelve los bytes."""
    try:
        # Usamos un archivo temporal
        tmp_file = f"temp_{nombre_vm}.png"
        subprocess.run([VBOX_MANAGE_CMD, "controlvm", nombre_vm, "screenshotpng", tmp_file], check=True)
        
        with open(tmp_file, "rb") as f:
            data = f.read()
        
        os.remove(tmp_file) # Limpiar
        return data
    except Exception as e:
        print(f"Error screenshot {nombre_vm}: {e}")
        return None

@app.route('/status/<int:id>')
def get_status(id):
    srv = next((s for s in SERVIDORES if s['id'] == id), None)
    if not srv: return jsonify({"estado": "error", "info": "ID no encontrado", "color": "grey"})

    # Primero intentamos ping simple o SSH para ver si responde
    # uptime es ligero
    res, exito = ejecutar_comando_ssh(srv, "uptime -p")
    
    # Si falla SSH, asumimos offline (o apagada)
    estado = "online" if exito else "offline"
    color = "green" if exito else "red"
    return jsonify({"estado": estado, "info": res if exito else "Sin conexión", "color": color})

@app.route('/accion/<int:id>/<string:cmd>')
def ejecutar_accion(id, cmd):
    srv = next((s for s in SERVIDORES if s['id'] == id), None)
    if not srv: return jsonify({"mensaje": "Servidor no encontrado"})

    if cmd == "encender":
        # Ejecutar comando local VBox
        ok, msg = encender_vm(srv['nombre'])
        return jsonify({"mensaje": msg, "exito": ok})
    
    elif cmd == "reiniciar":
        # SSH sudo reboot
        res, ok = ejecutar_comando_ssh(srv, "reboot", sudo=True)
        return jsonify({"mensaje": "Reiniciando..." if ok else f"Error: {res}"})
        
    elif cmd == "apagar":
        # SSH sudo shutdown
        res, ok = ejecutar_comando_ssh(srv, "shutdown -h now", sudo=True)
        return jsonify({"mensaje": "Apagando..." if ok else f"Error: {res}"})
        
    return jsonify({"mensaje": "Comando desconocido"})




def get_server_metrics(srv):
    """Obtiene métricas de CPU, RAM y Disco vía SSH."""
    cmd = "top -bn1 | grep 'Cpu(s)' | sed 's/.*, *\\([0-9.]*\\)%* id.*/\\1/' | awk '{print 100 - $1}' && free -m | grep Mem | awk '{print $3,$2}' && df -h / | tail -1 | awk '{print $5}'"
    # El comando devuelve:
    # Line 1: CPU Usage %
    # Line 2: RAM Used RAM Total
    # Line 3: Disk Usage % (con %)
    
    res, ok = ejecutar_comando_ssh(srv, cmd)
    if not ok: return None
    
    try:
        lines = res.split('\n')
        cpu = float(lines[0].strip())
        ram_used, ram_total = map(int, lines[1].split())
        ram_percent = round((ram_used / ram_total) * 100, 1)
        disk = lines[2].strip().replace('%', '')
        
        return {
            "cpu": round(cpu, 1),
            "ram": ram_percent,
            "ram_used": ram_used,
            "ram_total": ram_total,
            "disk": int(disk)
        }
    except:
        return None

@app.route('/metrics/<int:id>')
def metrics(id):
    srv = next((s for s in SERVIDORES if s['id'] == id), None)
    if not srv: return jsonify({"error": "Server not found"}), 404
    
    stats = get_server_metrics(srv)
    if stats:
        return jsonify(stats)
    else:
        # Fallback si falla la conexión (valores en 0)
        return jsonify({"cpu": 0, "ram": 0, "ram_used": 0, "ram_total": 0, "disk": 0, "error": "Connection Failed"})

@app.route('/monitor/<int:id>')
def monitor_vm(id):
    srv = next((s for s in SERVIDORES if s['id'] == id), None)
    if not srv: return "Not found", 404
    
    img_bytes = get_vm_screenshot_bytes(srv['nombre'])
    if img_bytes:
        return send_file(io.BytesIO(img_bytes), mimetype='image/png')
    else:
        return "No disponible", 404

if __name__ == '__main__':
    # Threaded=True es importante para manejar múltiples requests simultáneos (lectura/escritura ssh)
    app.run(debug=True, port=5000, threaded=True)