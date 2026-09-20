# Smart Agricultural Drone for Precision Fumigation

[![ROS 2](https://img.shields.io/badge/ROS2-Humble%20%2F%20Jazzy-blue)](https://docs.ros.org/)
[![Hardware](https://img.shields.io/badge/FCU-Pixhawk%206X-red)](https://pixhawk.org/)
[![Companion Board](https://img.shields.io/badge/Onboard-NVIDIA%20Jetson%20Xavier%20NX-green)](https://developer.nvidia.com/embedded/jetson-xavier-nx-devkit)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

An integrated, precision agriculture system engineered for targeted pesticide application in Zimbabwean farming. This repository contains all software, embedded systems firmware, CAD design files, aerodynamic calculations, and web visualization tools for our autonomous heavy-lift spraying drone.

---

## 📌 Project Overview

Traditional fumigation methods lead to chemical waste, high input costs, and negative environmental impacts. This project delivers a high-capacity (20L payload) multirotor drone featuring ROS 2 autonomous navigation and targeted spraying capabilities.

### Key Specifications

| Specification | Target Parameter |
| :--- | :--- |
| **Payload Capacity** | 20 Liters (~20 kg liquid) |
| **Frame Configuration** | Heavy-lift Carbon Fiber Quadcopter |
| **Flight Controller** | Pixhawk 6X[cite: 1] |
| **Onboard Computer** | NVIDIA Jetson Xavier NX[cite: 1] |
| **Flight Height** | 2 – 3 meters above canopy during spraying[cite: 1] |
| **Operational Speed** | 3 – 7 m/s[cite: 1] |
| **Spray Swath Width** | 4 – 9 meters[cite: 1] |
| **Field Capacity** | 10 – 15 hectares per operation cycle[cite: 1] |
| **Network Protocols** | MAVLink, Wi-Fi 6 / 5G, LoRaWAN, MQTT[cite: 1] |

---

## 👥 Sub-Team Organization & Work Streams

To maintain system modularity and seamless collaboration, this repository is divided into 5 primary work streams[cite: 1]:

| Work Stream | Directory | Focus Area | Sub-Team Members |
| :--- | :--- | :--- | :--- |
| **ROS 2 Navigation** | `/ros/` | Flight control nodes, autonomous path planning, MAVLink bridge[cite: 1] | **Andrew & Takudzwa**[cite: 1] |
| **Dashboard Interface** | `/dashboard/` | Farmer HMI, coverage mapping, live telemetry, cloud sync[cite: 1] | **Precious & Ian**[cite: 1] |
| **Calculations & Math** | `/calculations/` | Aerodynamics, thrust-to-weight ratio, payload vs. battery curves, dosage[cite: 1] | **Misheck & Tatenda**[cite: 1] |
| **CAD & Mechanical** | `/design/` | Carbon fiber frame modeling, 20L tank housing, sprayer nozzle assembly[cite: 1] | **Kudzi & Blessing**[cite: 1] |
| **Electronics & Power** | `/electronics/` | Schematic design, PCB layouts, power distribution, pump relays[cite: 1] | **Isaiah & Munashe**[cite: 1] |

---

## 📁 Repository Directory Structure

```text
smart-agri-drone/
├── .github/
│   └── CODEOWNERS              # Auto-assigns reviewers based on folder ownership
├── ros/                        # ROS 2 workspace (Andrew & Takudzwa)
│   ├── src/                    # Custom ROS 2 navigation and pump control nodes
│   └── README.md
├── dashboard/                  # Web dashboard application (Precious & Ian)
│   ├── web/                    # Telemetry display and spatial coverage map
│   └── README.md
├── calculations/               # Engineering scripts & analysis (Misheck & Tatenda)
│   ├── aerodynamics/           # Lift, drag, and thrust calculations
│   ├── payload_battery/        # Power draw and discharge math
│   └── README.md
├── design/                     # CAD files & mechanical drawings (Kudzi & Blessing)
│   ├── cad/                    # 3D models (.step, .sldprt)
│   ├── docs/                   # Renderings and physical layout guides
│   └── README.md
├── electronics/                # Circuit designs & PCB files (Isaiah & Munashe)
│   ├── schematics/             # Circuit diagrams (Pixhawk, Jetson, relays)
│   ├── pcb/                    # Board layouts (KiCad / Proteus)
│   └── README.md
├── .gitattributes              # Git LFS tracking rules
├── .gitignore                  # Build output and temp file exclusions
└── README.md                   # System-level documentation