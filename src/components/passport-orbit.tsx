'use client'

import { useEffect, useRef } from 'react'
import * as THREE from 'three'

export function PassportOrbit({ className = '' }: { className?: string }) {
  const hostRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const host = hostRef.current
    if (!host) return

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100)
    camera.position.set(0, 0, 8)

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setClearColor(0x000000, 0)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.8))
    host.appendChild(renderer.domElement)

    const group = new THREE.Group()
    scene.add(group)

    const shell = new THREE.Mesh(
      new THREE.IcosahedronGeometry(1.72, 2),
      new THREE.MeshStandardMaterial({
        color: 0x0f172a,
        metalness: 0.58,
        roughness: 0.34,
        wireframe: true,
      })
    )
    group.add(shell)

    const core = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.86, 1),
      new THREE.MeshStandardMaterial({
        color: 0x14b8a6,
        emissive: 0x0f766e,
        emissiveIntensity: 0.36,
        metalness: 0.25,
        roughness: 0.28,
      })
    )
    group.add(core)

    const ringMaterial = new THREE.MeshBasicMaterial({
      color: 0xf59e0b,
      transparent: true,
      opacity: 0.7,
    })

    const rings = [0, 1, 2].map((index) => {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(2.1 + index * 0.34, 0.01, 8, 120),
        ringMaterial.clone()
      )
      ring.rotation.set(index * 0.75, index * 0.42, index * 0.38)
      group.add(ring)
      return ring
    })

    const pointsGeometry = new THREE.BufferGeometry()
    const points = new Float32Array(132 * 3)
    for (let index = 0; index < points.length; index += 3) {
      const radius = 2.45 + Math.random() * 2.05
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      points[index] = radius * Math.sin(phi) * Math.cos(theta)
      points[index + 1] = radius * Math.sin(phi) * Math.sin(theta)
      points[index + 2] = radius * Math.cos(phi)
    }
    pointsGeometry.setAttribute('position', new THREE.BufferAttribute(points, 3))
    const pointCloud = new THREE.Points(
      pointsGeometry,
      new THREE.PointsMaterial({
        color: 0x0f766e,
        size: 0.032,
        transparent: true,
        opacity: 0.82,
      })
    )
    group.add(pointCloud)

    scene.add(new THREE.AmbientLight(0xffffff, 1.7))
    const keyLight = new THREE.DirectionalLight(0xffffff, 1.5)
    keyLight.position.set(3, 4, 6)
    scene.add(keyLight)

    let frame = 0
    let raf = 0

    function resize() {
      if (!host) return
      const width = host.clientWidth
      const height = host.clientHeight
      renderer.setSize(width, height, false)
      camera.aspect = width / Math.max(height, 1)
      camera.updateProjectionMatrix()
    }

    function animate() {
      frame += 0.01
      group.rotation.y = frame * 0.42
      group.rotation.x = Math.sin(frame * 0.7) * 0.16
      core.rotation.y = -frame * 0.84
      pointCloud.rotation.y = -frame * 0.18
      rings.forEach((ring, index) => {
        ring.rotation.z += 0.0025 + index * 0.0008
      })
      renderer.render(scene, camera)
      raf = requestAnimationFrame(animate)
    }

    const observer = new ResizeObserver(resize)
    observer.observe(host)
    resize()
    animate()

    return () => {
      cancelAnimationFrame(raf)
      observer.disconnect()
      renderer.dispose()
      pointsGeometry.dispose()
      shell.geometry.dispose()
      shell.material.dispose()
      core.geometry.dispose()
      core.material.dispose()
      rings.forEach((ring) => {
        ring.geometry.dispose()
        ;(ring.material as THREE.Material).dispose()
      })
      host.removeChild(renderer.domElement)
    }
  }, [])

  return (
    <div
      ref={hostRef}
      aria-hidden
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
    />
  )
}
