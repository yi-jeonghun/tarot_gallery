const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

class ImageConverter {
    constructor(inputFolder = '고흐', outputFolder = null) {
        this.inputFolder = inputFolder;
        this.outputFolder = outputFolder || inputFolder;
        this.supportedFormats = ['.png', '.PNG'];
    }

    /**
     * 경로가 파일인지 디렉토리인지 확인합니다
     */
    isFile(inputPath) {
        try {
            const stats = fs.statSync(inputPath);
            return stats.isFile();
        } catch (error) {
            return false;
        }
    }

    isDirectory(inputPath) {
        try {
            const stats = fs.statSync(inputPath);
            return stats.isDirectory();
        } catch (error) {
            return false;
        }
    }

    /**
     * 폴더 내의 모든 PNG 파일을 찾습니다
     */
    async findPngFiles() {
        try {
            const files = fs.readdirSync(this.inputFolder);
            return files.filter(file => {
                const ext = path.extname(file);
                return this.supportedFormats.includes(ext);
            }).sort((a, b) => {
                // 숫자 순서로 정렬 (1.PNG, 2.PNG, ..., 10.PNG, 11.PNG...)
                const numA = parseInt(path.basename(a, path.extname(a)));
                const numB = parseInt(path.basename(b, path.extname(b)));
                return numA - numB;
            });
        } catch (error) {
            console.error(`폴더를 읽는 중 오류 발생: ${error.message}`);
            return [];
        }
    }

    /**
     * 이미지 정보를 가져옵니다
     */
    async getImageInfo(imagePath) {
        try {
            const metadata = await sharp(imagePath).metadata();
            const stats = fs.statSync(imagePath);
            return {
                width: metadata.width,
                height: metadata.height,
                format: metadata.format,
                size: stats.size,
                sizeInMB: (stats.size / (1024 * 1024)).toFixed(2)
            };
        } catch (error) {
            console.error(`이미지 정보를 가져오는 중 오류 발생: ${error.message}`);
            return null;
        }
    }

    /**
     * 출력 파일명을 생성합니다
     */
    generateOutputFileName(originalName, suffix) {
        const baseName = path.basename(originalName, path.extname(originalName));
        const ext = path.extname(originalName);
        return `${baseName}_${suffix}${ext}`;
    }

    /**
     * 화질 압축 버전 생성 (_low)
     * 해상도는 유지하되 화질을 낮춰 파일 크기를 줄입니다
     */
    async createLowQualityVersion(inputPath, outputPath) {
        try {
            await sharp(inputPath)
                .png({ 
                    quality: 70,        // PNG 압축 품질
                    compressionLevel: 9, // 최대 압축
                    progressive: true    // 점진적 로딩
                })
                .toFile(outputPath);
            
            const originalInfo = await this.getImageInfo(inputPath);
            const compressedInfo = await this.getImageInfo(outputPath);
            
            console.log(`✓ Low quality: ${path.basename(outputPath)} (${originalInfo.sizeInMB}MB → ${compressedInfo.sizeInMB}MB)`);
            return true;
        } catch (error) {
            console.error(`Low quality 변환 실패 (${inputPath}): ${error.message}`);
            return false;
        }
    }

    /**
     * 중간 해상도 버전 생성 (_md)
     * 해상도를 1/3로 줄입니다
     */
    async createMediumResolution(inputPath, outputPath) {
        try {
            const metadata = await sharp(inputPath).metadata();
            const newWidth = Math.round(metadata.width / 3);
            const newHeight = Math.round(metadata.height / 3);

            await sharp(inputPath)
                .resize(newWidth, newHeight, {
                    kernel: sharp.kernel.lanczos3, // 고품질 리사이징
                    withoutEnlargement: true
                })
                .png({ 
                    quality: 85,
                    compressionLevel: 6
                })
                .toFile(outputPath);

            const originalInfo = await this.getImageInfo(inputPath);
            const resizedInfo = await this.getImageInfo(outputPath);
            
            console.log(`✓ Medium res: ${path.basename(outputPath)} (${metadata.width}x${metadata.height} → ${newWidth}x${newHeight}, ${originalInfo.sizeInMB}MB → ${resizedInfo.sizeInMB}MB)`);
            return true;
        } catch (error) {
            console.error(`Medium resolution 변환 실패 (${inputPath}): ${error.message}`);
            return false;
        }
    }

    /**
     * 소형 해상도 버전 생성 (_sm)
     * 해상도를 1/10으로 줄입니다
     */
    async createSmallResolution(inputPath, outputPath) {
        try {
            const metadata = await sharp(inputPath).metadata();
            const newWidth = Math.round(metadata.width / 10);
            const newHeight = Math.round(metadata.height / 10);

            await sharp(inputPath)
                .resize(newWidth, newHeight, {
                    kernel: sharp.kernel.lanczos3, // 고품질 리사이징
                    withoutEnlargement: true
                })
                .png({ 
                    quality: 90,
                    compressionLevel: 6
                })
                .toFile(outputPath);

            const originalInfo = await this.getImageInfo(inputPath);
            const resizedInfo = await this.getImageInfo(outputPath);
            
            console.log(`✓ Small res: ${path.basename(outputPath)} (${metadata.width}x${metadata.height} → ${newWidth}x${newHeight}, ${originalInfo.sizeInMB}MB → ${resizedInfo.sizeInMB}MB)`);
            return true;
        } catch (error) {
            console.error(`Small resolution 변환 실패 (${inputPath}): ${error.message}`);
            return false;
        }
    }

    /**
     * 단일 이미지를 모든 버전으로 변환합니다
     */
    async convertSingleImage(fileName) {
        let inputPath, outputDir, baseName;
        
        // 만약 fileName이 전체 경로라면
        if (path.isAbsolute(fileName) || fileName.includes('/')) {
            inputPath = fileName;
            baseName = path.basename(fileName);
            // 출력 디렉토리 결정
            if (this.outputFolder && this.outputFolder !== this.inputFolder) {
                outputDir = this.outputFolder;
            } else {
                outputDir = path.dirname(fileName);
            }
        } else {
            // 기존 방식: 파일명만 주어진 경우
            inputPath = path.join(this.inputFolder, fileName);
            baseName = fileName;
            outputDir = this.outputFolder;
        }
        
        // 출력 파일 경로 설정
        const lowPath = path.join(outputDir, this.generateOutputFileName(baseName, 'low'));
        const mdPath = path.join(outputDir, this.generateOutputFileName(baseName, 'md'));
        const smPath = path.join(outputDir, this.generateOutputFileName(baseName, 'sm'));

        console.log(`\n🎨 Processing: ${baseName}`);

        // 원본 이미지 정보 출력
        const originalInfo = await this.getImageInfo(inputPath);
        if (originalInfo) {
            console.log(`   Original: ${originalInfo.width}x${originalInfo.height}, ${originalInfo.sizeInMB}MB`);
        }

        // 병렬로 모든 버전 생성
        const results = await Promise.allSettled([
						//용량 문제로 low quality 버전은 생성하지 않음
            //this.createLowQualityVersion(inputPath, lowPath),
            this.createMediumResolution(inputPath, mdPath),
            this.createSmallResolution(inputPath, smPath)
        ]);

        return results.every(result => result.status === 'fulfilled' && result.value);
    }

    /**
     * 단일 파일을 변환합니다
     */
    async convertSingleFile(filePath) {
        console.log('🚀 타로 카드 이미지 변환기 시작 (단일 파일)');
        console.log(`📁 입력 파일: ${filePath}`);
        console.log(`📁 출력 디렉토리: ${this.outputFolder || path.dirname(filePath)}`);

        // 파일 확장자 확인
        const ext = path.extname(filePath);
        if (!this.supportedFormats.includes(ext)) {
            console.log(`❌ 지원하지 않는 파일 형식입니다: ${ext}`);
            console.log(`지원 형식: ${this.supportedFormats.join(', ')}`);
            return;
        }

        console.log(`🎯 3개의 버전을 생성합니다: _md (1/3크기), _sm (1/10크기)`);

        const success = await this.convertSingleImage(filePath);
        
        if (success) {
            console.log(`\n🎉 변환 완료!`);
            console.log(`✅ ${path.basename(filePath)} 변환 성공`);
        } else {
            console.log(`\n❌ 변환 실패`);
            console.log(`❌ ${path.basename(filePath)} 변환 실패`);
        }
    }

    /**
     * 모든 PNG 파일을 변환합니다
     */
    async convertAllImages() {
        console.log('🚀 타로 카드 이미지 변환기 시작');
        console.log(`📁 입력 폴더: ${this.inputFolder}`);
        console.log(`📁 출력 폴더: ${this.outputFolder}`);

        const pngFiles = await this.findPngFiles();
        
        if (pngFiles.length === 0) {
            console.log('❌ PNG 파일을 찾을 수 없습니다.');
            return;
        }

        console.log(`📸 총 ${pngFiles.length}개의 PNG 파일을 발견했습니다.`);
        console.log(`🎯 각 이미지당 3개의 버전을 생성합니다: _low (화질압축), _md (1/3크기), _sm (1/10크기)`);

        let successCount = 0;
        let totalCount = pngFiles.length;

        for (let i = 0; i < pngFiles.length; i++) {
            const fileName = pngFiles[i];
            console.log(`\n⏳ Progress: ${i + 1}/${totalCount}`);
            
            const success = await this.convertSingleImage(fileName);
            if (success) {
                successCount++;
            }
        }

        console.log(`\n🎉 변환 완료!`);
        console.log(`✅ 성공: ${successCount}/${totalCount}`);
        
        if (successCount < totalCount) {
            console.log(`❌ 실패: ${totalCount - successCount}/${totalCount}`);
        }
    }

    /**
     * 테스트 모드: 처음 3개 파일만 변환
     */
    async testMode() {
        console.log('🧪 테스트 모드 실행 (처음 3개 파일만 변환)');
        
        const pngFiles = await this.findPngFiles();
        const testFiles = pngFiles.slice(0, 3);

        if (testFiles.length === 0) {
            console.log('❌ 테스트할 PNG 파일을 찾을 수 없습니다.');
            return;
        }

        console.log(`📸 테스트 파일: ${testFiles.join(', ')}`);

        for (const fileName of testFiles) {
            await this.convertSingleImage(fileName);
        }

        console.log('\n🧪 테스트 완료! 결과를 확인해보세요.');
    }

    /**
     * 단일 파일 테스트 모드
     */
    async testSingleFile(filePath) {
        console.log('🧪 단일 파일 테스트 모드 실행');
        console.log(`📄 테스트 파일: ${path.basename(filePath)}`);
        
        const success = await this.convertSingleImage(filePath);
        
        if (success) {
            console.log('\n🧪 테스트 완료! 결과를 확인해보세요.');
        } else {
            console.log('\n❌ 테스트 실패');
        }
    }
}

// 실행 부분
async function main() {
    const args = process.argv.slice(2);
    const isTestMode = args.includes('--test');
    
    // 테스트 모드가 아닌 인수들만 필터링
    const nonTestArgs = args.filter(arg => !arg.startsWith('--'));
    
    if (nonTestArgs.length < 1) {
        console.log('❌ 사용법: node image-converter.js <입력 경로> [목적지 디렉토리] [--test]');
        console.log('예시 (디렉토리 처리): node image-converter.js 고흐 output');
        console.log('예시 (단일 파일 처리): node image-converter.js 고흐/1.PNG output');
        console.log('예시 (테스트 모드): node image-converter.js 고흐 output --test');
        process.exit(1);
    }

    const inputPath = nonTestArgs[0];
    const outputDirectory = nonTestArgs[1];

    // 입력 경로 존재 여부 확인
    const fs = require('fs');
    if (!fs.existsSync(inputPath)) {
        console.error(`❌ 입력 경로를 찾을 수 없습니다: ${inputPath}`);
        process.exit(1);
    }

    const converter = new ImageConverter();
    
    // 입력이 파일인지 디렉토리인지 확인
    if (converter.isFile(inputPath)) {
        // 단일 파일 처리
        console.log(`📄 단일 파일 모드`);
        
        // 출력 디렉토리 설정
        if (outputDirectory) {
            if (!fs.existsSync(outputDirectory)) {
                console.error(`❌ 목적지 디렉토리를 찾을 수 없습니다: ${outputDirectory}`);
                process.exit(1);
            }
            converter.outputFolder = outputDirectory;
        } else {
            // 출력 디렉토리가 지정되지 않으면 파일이 있는 디렉토리 사용
            converter.outputFolder = path.dirname(inputPath);
        }
        
        try {
            if (isTestMode) {
                await converter.testSingleFile(inputPath);
            } else {
                await converter.convertSingleFile(inputPath);
            }
        } catch (error) {
            console.error('❌ 파일 변환 중 오류 발생:', error.message);
            process.exit(1);
        }
        
    } else if (converter.isDirectory(inputPath)) {
        // 디렉토리 처리 (기존 로직)
        console.log(`📁 디렉토리 모드`);
        
        if (!outputDirectory) {
            console.log('❌ 디렉토리 모드에서는 목적지 디렉토리가 필요합니다.');
            console.log('사용법: node image-converter.js <입력 디렉토리> <목적지 디렉토리> [--test]');
            process.exit(1);
        }

        // 목적지 디렉토리 존재 여부 확인
        if (!fs.existsSync(outputDirectory)) {
            console.error(`❌ 목적지 디렉토리를 찾을 수 없습니다: ${outputDirectory}`);
            process.exit(1);
        }

        console.log(`📁 입력 디렉토리: ${inputPath}`);
        console.log(`📁 목적지 디렉토리: ${outputDirectory}`);
        
        converter.inputFolder = inputPath;
        converter.outputFolder = outputDirectory;

        try {
            if (isTestMode) {
                await converter.testMode();
            } else {
                await converter.convertAllImages();
            }
        } catch (error) {
            console.error('❌ 프로그램 실행 중 오류 발생:', error.message);
            process.exit(1);
        }
    } else {
        console.error(`❌ 입력 경로가 파일도 디렉토리도 아닙니다: ${inputPath}`);
        process.exit(1);
    }
}

// 스크립트가 직접 실행될 때만 main 함수 호출
if (require.main === module) {
    main();
}

module.exports = ImageConverter;